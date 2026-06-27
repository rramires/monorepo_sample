# 02 — Backend (fecha o contrato)

Implementa a API real de **Notices** e troca o mock pela API de verdade, revalidando
a mesma tela. Faça **depois** do [`01-frontend`](./01-frontend-pt-BR.md) — o contrato
compartilhado (`@root/contracts/notices.ts`) já existe e é reaproveitado aqui.

**Branch desta parte:** `git checkout -b feat/notices-backend` (a partir do `master`
já com o front mergeado, ou continue na sua linha de trabalho).

Camadas da casa: **route → controller → use-case → repository (interface + impl)**,
montadas por uma **factory**. Controller não fala com Prisma; use-case não fala com
HTTP. Modelo análogo: [`api/src/http/controllers/modules`](../api/src/http/controllers/modules/).

---

## Pré-requisitos — MySQL de pé

```sh
pnpm -C api compose:up      # sobe o MySQL (Docker)
# espere ficar healthy:
docker inspect --format '{{.State.Health.Status}}' monorepo_sample-solid_api_mysql-1
```

> ⚠️ **Gotcha — `.env` e health.** Comandos de banco (`migrate`, `seeddb`) falham até
> o container estar `healthy`, e exigem `api/.env` (com `DATABASE_URL`). Se faltar,
> `cp api/.env.example api/.env`. `.env` é gitignored — nunca commite segredo.

---

## Fase 1 — Schema Prisma + migração + barrel

**Edite** `api/prisma/schema.prisma` — adicione o model (mesmo shape do contrato;
`category` como `String` validado pelo Zod do contracts):

```prisma
model Notice {
  id         String   @id @default(uuid()) @db.VarChar(36)
  title      String   @db.VarChar(200)
  category   String   @db.VarChar(20)
  created_at DateTime @default(now())

  @@map("notices")
}
```

**Gere a migração + o client:**

```sh
pnpm -C api exec prisma migrate dev --name add_notices
pnpm -C api exec prisma generate
```

**Recrie o barrel** `api/src/prisma-client/index.ts` com exatamente:

```ts
export * from './client.js'
```

> ⚠️ **Gotcha nº 1 (a maior armadilha) — `prisma generate` APAGA o barrel.** O
> `migrate dev` às vezes deixa o barrel intacto, mas o `generate` explícito o
> remove. Trate `migrate dev` + `generate` como um par e **recrie o barrel logo
> depois**, ou todo `import { Notice } from '@/prisma-client'` quebra a compilação.

> ⚠️ **Gotcha nº 2 — `src/prisma-client/` é versionado (não gitignored).** O commit
> do schema precisa dar `git add` na pasta gerada inteira **junto** com o schema e a
> migração — senão um checkout limpo não compila:
>
> ```sh
> git add api/prisma/schema.prisma api/prisma/migrations/ api/src/prisma-client/
> ```

**Gate:** `pnpm -C api lint && pnpm -C api compile && pnpm -C api test`
**Commit:** `feat(notices): add Notice model + add_notices migration`

---

## Fase 2 — Repositório (interface + in-memory + prisma)

A dependência entra por **interface**, com duas implementações: in-memory (testes
unit) e Prisma (produção).

**Crie** `api/src/repositories/i-notices-repository.ts`:

```ts
import { Notice } from '@/prisma-client'

// Edição parcial: `undefined` = mantém; campos providos sobrescrevem.
export interface INoticeUpdateInput {
	title?: string
	category?: string
}

export interface INoticesRepository {
	list(): Promise<Notice[]>
	create(data: { title: string; category: string }): Promise<Notice>
	findById(id: string): Promise<Notice | null>
	update(id: string, data: INoticeUpdateInput): Promise<Notice>
	delete(id: string): Promise<void>
}
```

**Crie** `api/src/repositories/prisma/prisma-notices-repository.ts` (CRUD via
`prisma.notice.*`, `list` ordena `created_at desc`). E
`api/src/repositories/in-memory/in-memory-notices-repository.ts`.

> ⚠️ **Gotcha — o in-memory tem que gerar `created_at` e `id`.** Diferente de
> Modules (sem timestamp), `Notice` exige `created_at`; no real, o Prisma resolve via
> `@default(now())`/`@default(uuid())`. No in-memory, gere você:
>
> ```ts
> const notice = { id: randomUUID(), title: data.title, category: data.category, created_at: new Date() }
> ```

**Gate:** `pnpm -C api lint && pnpm -C api compile && pnpm -C api test`
**Commit:** `feat(notices): notices repository (interface + in-memory + prisma)`

---

## Fase 3 — Use-case + factory + teste unit

**Crie** `api/src/use-cases/notices-use-case.ts` — lógica de negócio pura; `update` e
`remove` levantam `ResourceNotFoundError` quando o `findById` falha (reusa a classe
existente; **não invente código de erro novo**):

```ts
import { CreateNoticeBody, UpdateNoticeBody } from '@root/contracts'

import { Notice } from '@/prisma-client'
import { INoticesRepository } from '@/repositories/i-notices-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

export class NoticesUseCase {
	constructor(private noticesRepository: INoticesRepository) {}

	async list(): Promise<Notice[]> {
		return this.noticesRepository.list()
	}

	async create(body: CreateNoticeBody): Promise<Notice> {
		return this.noticesRepository.create(body)
	}

	async update(id: string, body: UpdateNoticeBody): Promise<Notice> {
		const existing = await this.noticesRepository.findById(id)
		if (!existing) throw new ResourceNotFoundError()
		return this.noticesRepository.update(id, body)
	}

	async remove(id: string): Promise<void> {
		const existing = await this.noticesRepository.findById(id)
		if (!existing) throw new ResourceNotFoundError()
		await this.noticesRepository.delete(id)
	}
}
```

**Crie** a factory `api/src/use-cases/factories/make-notices-use-case.ts` (injeta o
`PrismaNoticesRepository`) e o teste unit
`api/src/use-cases/notices-use-case.spec.ts` (usa o **in-memory**; cobre create/list/
update/remove + os dois 404). Modelo:
[`modules-use-case.spec.ts`](../api/src/use-cases/modules-use-case.spec.ts).

**Gate:** `pnpm -C api lint && pnpm -C api compile && pnpm -C api test` (deve subir a
contagem de unit, ex.: 119 → 125).
**Commit:** `feat(notices): NoticesUseCase + factory + unit spec`

---

## Fase 4 — Controllers + rotas + registro

Um controller por verbo. O controller faz `parse` do body com o **schema
compartilhado** e responde `reply.send({ notice })` / `{ notices }`.

**Crie** `api/src/http/controllers/notices/{list,create,update,delete}-controller.ts`.
Exemplo do create:

```ts
import { createNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function createController(request: FastifyRequest, reply: FastifyReply) {
	const body = createNoticeBodySchema.parse(request.body)
	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.create(body)
	return reply.status(201).send({ notice })
}
```

O `update`/`delete` validam o param com `z.object({ noticeId: z.uuid() })`.

**Crie** `api/src/http/controllers/notices/routes.ts` — hook de auth no grupo +
`requireScreen('notices.notices', action)` por rota:

```ts
import { FastifyInstance } from 'fastify'
import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'
import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { listController } from './list-controller'
import { updateController } from './update-controller'

export async function noticesRoutes(app: FastifyInstance) {
	app.addHook('onRequest', verifyJwtMiddleware)
	app.get('/notices', { onRequest: [requireScreen('notices.notices', 'view')] }, listController)
	app.post('/notices', { onRequest: [requireScreen('notices.notices', 'create')] }, createController)
	app.patch('/notices/:noticeId', { onRequest: [requireScreen('notices.notices', 'edit')] }, updateController)
	app.delete('/notices/:noticeId', { onRequest: [requireScreen('notices.notices', 'delete')] }, deleteController)
}
```

**Registre** em `api/src/app.ts`: `import { noticesRoutes } from './http/controllers/notices/routes'`
e `app.register(noticesRoutes)` junto dos outros `app.register(...)`.

> ⚠️ **Gotcha — param `:noticeId`.** Bate com o mock do front. Copiar `:id`/`params.id`
> de Modules gera um `undefined` silencioso.

**Gate:** `pnpm -C api lint && pnpm -C api compile && pnpm -C api test`
**Commit:** `feat(notices): notices controllers + routes + app register`

---

## Fase 5 — Teste e2e das rotas

**Crie** `api/src/http/controllers/notices/routes.spec.ts`. Autentica como **ADMIN**
via `createAndAuthUser(app, true)` e cobre create/list/update/delete + 404
(`resource_not_found`) + 400 (`validation_error` em categoria inválida).

```ts
token = (await createAndAuthUser(app, true)).token
// ...
const res = await request(app.server).post('/notices').set('Authorization', `Bearer ${token}`).send({ title: 'Pool closed', category: 'warning' })
expect(res.statusCode).toEqual(201)
```

> ⚠️ **Gotcha — ADMIN bypassa o `requireScreen`.** O e2e usa um admin, e o
> `GetUserPermissionsUseCase` dá curto-circuito para role `ADMIN` ("tudo liberado").
> Então as rotas respondem **sem nenhum grant de seed** — o e2e verde **não** prova a
> fiação da seed (isso é a Fase 6).

**Gate (toca rota → e2e, MySQL up):**

```sh
pnpm -C api lint && pnpm -C api compile && pnpm -C api test && pnpm -C api test:e2e
```

**Commit:** `test(notices): e2e routes spec (admin CRUD + 404 + 400)`

---

## Fase 6 — Seed (para um deploy real mostrar a tela)

O menu real é montado de `ProfileScreen` (membership) + grants. **Edite**
`api/prisma/seed.ts` em **quatro pontos** (todos têm que concordar):

1. `MODULES` → `{ key: 'notices', name: 'Notices', description: 'Notice board for members.', order: 3, is_system: false }`
2. `SCREENS` → `{ key: 'notices.notices', name: 'Notices', module: 'notices', path: '/notices', description: 'Notice board for members.', order: 1, is_system: false }` — **`path` é obrigatório**: o filtro de menu descarta tela com `path` nulo.
3. `PERMISSIONS` → `view/create/edit/delete` para `notices.notices`.
4. `PROFILE_GRANTS` → conceda a algum **perfil não-admin** (ex.: `support` com CRUD
   completo; `gym-member`/`gym-manager` com `view`).

Aplique e verifique:

```sh
pnpm -C api seeddb
```

> ⚠️ **Gotcha — admin é ROLE, não perfil.** Não existe "perfil admin" na seed; o
> admin (role) bypassa tudo. Para um **não-admin** ver a tela, ele precisa de
> **membership** (`ProfileScreen`) + grant `view`. Por isso a Fase 5 (e2e admin) não
> exercita isto — confira a seed rodando `seeddb` e olhando as linhas.

**Gate:** `pnpm -C api lint && pnpm -C api compile && pnpm -C api test` (+ `test:e2e`).
**Commit:** `feat(notices): seed notices module + screen + permissions + grants`

---

## Fase 7 — Trocar o mock pela API real e revalidar

Agora a mesma tela do front roda contra o backend de verdade.

```sh
pnpm -C api db:fresh     # recria o MySQL + migra + seed (estado limpo)
pnpm -C api dev          # API real em :3333
pnpm -C web dev          # front em modo real (NÃO dev:test) — fala com :3333
```

Logue com um usuário **semeado** que tenha o grant de Notices (pela Fase 6) e refaça
o smoke da [Fase 7 do front](./01-frontend-pt-BR.md#fase-7--smoke-no-browser-obrigatório):
loading/empty/error, **cold-load** do Select na edição, criar/editar/excluir.

> ⚠️ **Gotcha — senha no modo real ≠ mock.** Os usuários demo semeados usam
> `ADMIN_PASSWORD` do `api/.env` (ex.: `Admin@12345`), **não** o `Password1!` do
> mock. Para ver um não-admin (com grant `view`), use o perfil que você concedeu na
> Fase 6 (ex.: `support`).

> O cliente do front (`web/src/api/notices.ts`) e o mock já batem no mesmo contrato,
> então a troca deve ser transparente. Qualquer divergência aqui é sinal de mock
> infiel — corrija os dois juntos.

---

## Fim — docs + entrega

1. **Revise as docs nos 2 idiomas** de cada app que você tocou:
   `api/README*.md` + `api/PROJECT*.md` (tabela de rotas, models, env) e
   `web/README*.md` + `web/PROJECT*.md` (tabela de rotas/telas, features). Os
   `web/docs/TUTORIAL_*` são **congelados** — não edite.
2. **Pare e deixe o usuário** testar no browser e **autorizar o merge**. Só então:
   `git checkout master && git merge --no-ff feat/notices-backend`.
3. **Nunca dê push** — é o usuário quem faz.

## Resumo das fases (back)

| Fase | Entrega | Gate |
|------|---------|------|
| 1 | schema + migração + barrel | `lint+compile+test` |
| 2 | repositório (interface + 2 impls) | `lint+compile+test` |
| 3 | use-case + factory + unit spec | `lint+compile+test` |
| 4 | controllers + rotas + register | `lint+compile+test` |
| 5 | e2e das rotas | `+ test:e2e` |
| 6 | seed (módulo/tela/perms/grants) | `lint+compile+test` |
| 7 | trocar mock→real + revalidar | smoke manual |
