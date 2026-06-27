# 02 — Backend (fecha o contrato)

Implementa a API real de **Notices** e troca o mock pela API de verdade, revalidando
a mesma tela. Faça **depois** do [`01-frontend`](./01-frontend-pt-BR.md) — o contrato
compartilhado (`@root/contracts/notices.ts`) já existe e é reaproveitado aqui.

**Branch desta parte** (a partir do `master` já com o front mergeado, ou continue
na sua linha de trabalho):

```sh
git checkout -b feat/notices-backend
```

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

> ⚠️ **Pegadinha — `.env` e health.** Comandos de banco (`migrate`, `seeddb`) falham até
> o container estar `healthy`, e exigem `api/.env` (com `DATABASE_URL`). Se faltar,
> `cp api/.env.example api/.env`. `.env` é gitignored — nunca commite segredo.

---

## Fase 1 — Schema Prisma + migração + barrel

**Edite** `api/prisma/schema.prisma` — **ao fim do arquivo** (depois do último
`model`), adicione o model (`category` como `String`, validado pelo Zod do contracts):

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

> ⚠️ **Pegadinha nº 1 (a maior armadilha) — `prisma generate` APAGA o barrel.** O
> `migrate dev` às vezes deixa o barrel intacto, mas o `generate` explícito o
> remove. Trate `migrate dev` + `generate` como um par e **recrie o barrel logo
> depois**, ou todo `import { Notice } from '@/prisma-client'` quebra a compilação.

> ⚠️ **Pegadinha nº 2 — `src/prisma-client/` é versionado (não gitignored).** Por isso
> o `git add` do Commit abaixo inclui a **pasta gerada inteira** (não só o `index.ts`),
> junto com o schema e a migração — senão um checkout limpo não compila.


**Validação:**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/prisma/schema.prisma api/prisma/migrations/ api/src/prisma-client/
git commit -m "feat(notices): add Notice model + add_notices migration" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 2 — Repositório (interface + in-memory + prisma)

A dependência entra por **interface**, com duas implementações: in-memory (testes
unit) e Prisma (produção).

Na pasta api/src/repositories/ **Crie** `i-notices-repository.ts`:

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

Na pasta `api/src/repositories/in-memory/` **Crie** `in-memory-notices-repository.ts`
(usado nos testes unit):

```ts
import { randomUUID } from 'node:crypto'

import { Notice } from '@/prisma-client'

import { INoticesRepository, INoticeUpdateInput } from '../i-notices-repository'

export class InMemoryNoticesRepository implements INoticesRepository {
	public items: Notice[] = []

	async list() {
		return this.items
	}

	async create(data: { title: string; category: string }) {
		// id + created_at são gerados aqui (no real, o Prisma faz via @default).
		const notice = {
			id: randomUUID(),
			title: data.title,
			category: data.category,
			created_at: new Date(),
		}
		this.items.push(notice)
		return notice
	}

	async findById(id: string) {
		return this.items.find((item) => item.id === id) ?? null
	}

	async update(id: string, data: INoticeUpdateInput) {
		// O use-case garante existência; muda só os campos providos.
		const notice = this.items.find((item) => item.id === id)
		if (!notice) {
			throw new Error('Notice not found')
		}
		if (data.title !== undefined) {
			notice.title = data.title
		}
		if (data.category !== undefined) {
			notice.category = data.category
		}
		return notice
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
	}
}
```

> ⚠️ **Pegadinha — o in-memory gera `id` + `created_at` na mão.** Diferente de Modules
> (sem timestamp), `Notice` exige `created_at`; no repo real o Prisma resolve via
> `@default(now())`/`@default(uuid())`, mas no in-memory você gera (`randomUUID()` +
> `new Date()`) — senão dá erro de tipo.

Na pasta `api/src/repositories/prisma/` **Crie** `prisma-notices-repository.ts`
(CRUD via `prisma.notice.*`; `list` ordena por `created_at desc`):

```ts
import { prisma } from '@/lib/prisma'

import { INoticesRepository, INoticeUpdateInput } from '../i-notices-repository'

export class PrismaNoticesRepository implements INoticesRepository {
	async list() {
		const notices = await prisma.notice.findMany({
			orderBy: { created_at: 'desc' },
		})
		return notices
	}

	async create(data: { title: string; category: string }) {
		const notice = await prisma.notice.create({ data })
		return notice
	}

	async findById(id: string) {
		const notice = await prisma.notice.findUnique({ where: { id } })
		return notice
	}

	async update(id: string, data: INoticeUpdateInput) {
		// Existência é garantida pelo use-case (findById antes); chaves `undefined`
		// são ignoradas pelo Prisma, então só os campos providos mudam.
		const notice = await prisma.notice.update({ where: { id }, data })
		return notice
	}

	async delete(id: string) {
		await prisma.notice.delete({ where: { id } })
	}
}
```

**Validação:**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/src/repositories/i-notices-repository.ts \
  api/src/repositories/in-memory/in-memory-notices-repository.ts \
  api/src/repositories/prisma/prisma-notices-repository.ts
git commit -m "feat(notices): notices repository (interface + in-memory + prisma)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 3 — Use-case + factory + teste unit

Na pasta api/src/use-cases/ **Crie** `notices-use-case.ts` — lógica de negócio pura; `update` e
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

Na pasta `api/src/use-cases/factories/` **Crie** `make-notices-use-case.ts` (injeta o
`PrismaNoticesRepository`):

```ts
import { PrismaNoticesRepository } from '@/repositories/prisma/prisma-notices-repository'

import { NoticesUseCase } from '../notices-use-case'

export function makeNoticesUseCase() {
	const noticesRepository = new PrismaNoticesRepository()
	const useCase = new NoticesUseCase(noticesRepository)
	return useCase
}
```

Na pasta `api/src/use-cases/` **Crie** o teste unit `notices-use-case.spec.ts` (usa o
**in-memory**; cobre create/list/update/remove + os dois 404):

```ts
import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryNoticesRepository } from '@/repositories/in-memory/in-memory-notices-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { NoticesUseCase } from './notices-use-case'

let noticesRepository: InMemoryNoticesRepository
let sut: NoticesUseCase

describe('Notices Use Case', () => {
	beforeEach(() => {
		noticesRepository = new InMemoryNoticesRepository()
		sut = new NoticesUseCase(noticesRepository)
	})

	it('creates a notice (id + created_at generated)', async () => {
		const notice = await sut.create({
			title: 'Pool closed for maintenance',
			category: 'warning',
		})

		expect(notice.id).toEqual(expect.any(String))
		expect(notice.created_at).toBeInstanceOf(Date)
		expect(notice.title).toEqual('Pool closed for maintenance')
		expect(notice.category).toEqual('warning')
		expect(noticesRepository.items).toHaveLength(1)
	})

	it('lists notices', async () => {
		await sut.create({ title: 'A', category: 'info' })
		await sut.create({ title: 'B', category: 'urgent' })

		const notices = await sut.list()

		expect(notices).toHaveLength(2)
	})

	it('updates a notice (only provided fields change)', async () => {
		const created = await sut.create({ title: 'Old', category: 'info' })

		const updated = await sut.update(created.id, { title: 'New' })

		expect(updated.title).toEqual('New')
		expect(updated.category).toEqual('info')
	})

	it('throws ResourceNotFoundError updating a missing notice', async () => {
		await expect(
			sut.update('does-not-exist', { title: 'X' }),
		).rejects.toBeInstanceOf(ResourceNotFoundError)
	})

	it('removes a notice', async () => {
		const created = await sut.create({ title: 'Bye', category: 'info' })

		await sut.remove(created.id)

		expect(noticesRepository.items).toHaveLength(0)
	})

	it('throws ResourceNotFoundError removing a missing notice', async () => {
		await expect(sut.remove('does-not-exist')).rejects.toBeInstanceOf(
			ResourceNotFoundError,
		)
	})
})
```

**Validação** (deve subir a contagem de unit, ex.: 119 → 125):

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/src/use-cases/notices-use-case.ts \
  api/src/use-cases/factories/make-notices-use-case.ts \
  api/src/use-cases/notices-use-case.spec.ts
git commit -m "feat(notices): NoticesUseCase + factory + unit spec" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 4 — Controllers + rotas + registro

Um controller por verbo. O controller faz `parse` do body com o **schema
compartilhado** e responde `reply.send({ notice })` / `{ notices }`.

Os controllers ficam numa **pasta nova** — crie-a primeiro:

```sh
mkdir -p api/src/http/controllers/notices
```

Crie os quatro nessa pasta, um por verbo (ordem CRUD):

`list-controller.ts`:

```ts
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const noticesUseCase = makeNoticesUseCase()
	const notices = await noticesUseCase.list()

	return reply.send({
		notices,
	})
}
```

`create-controller.ts`:

```ts
import { createNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const body = createNoticeBodySchema.parse(request.body)

	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.create(body)

	return reply.status(201).send({
		notice,
	})
}
```

`update-controller.ts` (valida o param `noticeId` com `z.uuid()`):

```ts
import { updateNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		noticeId: z.uuid(),
	})
	const { noticeId } = paramsSchema.parse(request.params)

	const body = updateNoticeBodySchema.parse(request.body)

	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.update(noticeId, body)

	return reply.send({
		notice,
	})
}
```

`delete-controller.ts`:

```ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		noticeId: z.uuid(),
	})
	const { noticeId } = paramsSchema.parse(request.params)

	const noticesUseCase = makeNoticesUseCase()
	await noticesUseCase.remove(noticeId)

	return reply.status(204).send()
}
```

Na mesma pasta **Crie** `routes.ts` — hook de auth no grupo +
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

**Registre** as rotas em `api/src/app.ts`:

```ts
// adicione o import (simple-import-sort reordena):
import { noticesRoutes } from './http/controllers/notices/routes'
// e registre junto aos outros app.register(...):
app.register(noticesRoutes)
```

> ⚠️ **Pegadinha — param `:noticeId`.** Bate com o mock do front. Copiar `:id`/`params.id`
> de Modules gera um `undefined` silencioso.

**Validação:**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/src/http/controllers/notices/list-controller.ts \
  api/src/http/controllers/notices/create-controller.ts \
  api/src/http/controllers/notices/update-controller.ts \
  api/src/http/controllers/notices/delete-controller.ts \
  api/src/http/controllers/notices/routes.ts api/src/app.ts
git commit -m "feat(notices): notices controllers + routes + app register" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 5 — Teste e2e das rotas

Na pasta api/src/http/controllers/notices/ **Crie** `routes.spec.ts`. Autentica como **ADMIN**
via `createAndAuthUser(app, true)` e cobre create/list/update/delete + 404
(`resource_not_found`) + 400 (`validation_error` em categoria inválida).

```ts
import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Notices routes (e2e)', () => {
	// Autentica uma vez como ADMIN (o `true` cria+autentica um admin; ADMIN bypassa
	// o requireScreen, então as rotas respondem sem grant de seed). Helper de
	// credencial fixa daria 409 numa 2ª chamada — compartilhe o token.
	let token: string

	beforeAll(async () => {
		await app.ready()
		token = (await createAndAuthUser(app, true)).token
	})

	afterAll(async () => {
		await app.close()
	})

	it('should be able to create, list, update and delete a notice', async () => {
		// create
		const createResponse = await request(app.server)
			.post('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Pool closed for maintenance', category: 'warning' })

		expect(createResponse.statusCode).toEqual(201)
		expect(createResponse.body.notice).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				title: 'Pool closed for maintenance',
				category: 'warning',
				created_at: expect.any(String),
			}),
		)
		const noticeId = createResponse.body.notice.id

		// list
		const listResponse = await request(app.server)
			.get('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(listResponse.statusCode).toEqual(200)
		expect(Array.isArray(listResponse.body.notices)).toBe(true)

		// update
		const updateResponse = await request(app.server)
			.patch(`/notices/${noticeId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Pool reopened', category: 'info' })

		expect(updateResponse.statusCode).toEqual(200)
		expect(updateResponse.body.notice.title).toEqual('Pool reopened')
		expect(updateResponse.body.notice.category).toEqual('info')

		// delete
		const deleteResponse = await request(app.server)
			.delete(`/notices/${noticeId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(deleteResponse.statusCode).toEqual(204)
	})

	it('returns 404 updating a non-existent notice', async () => {
		const response = await request(app.server)
			.patch(`/notices/${randomUUID()}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Nope' })

		expect(response.statusCode).toEqual(404)
		expect(response.body.code).toEqual('resource_not_found')
	})

	it('returns 404 deleting a non-existent notice', async () => {
		const response = await request(app.server)
			.delete(`/notices/${randomUUID()}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(404)
		expect(response.body.code).toEqual('resource_not_found')
	})

	it('rejects an invalid category at the body schema (400)', async () => {
		const response = await request(app.server)
			.post('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Bad', category: 'not-a-category' })

		expect(response.statusCode).toEqual(400)
		expect(response.body.code).toEqual('validation_error')
	})
})
```

> ⚠️ **Pegadinha — ADMIN bypassa o `requireScreen`.** O e2e usa um admin, e o
> `GetUserPermissionsUseCase` dá curto-circuito para role `ADMIN` ("tudo liberado").
> Então as rotas respondem **sem nenhum grant de seed** — o e2e verde **não** prova a
> fiação da seed (isso é a Fase 6).

**Validação (toca rota → e2e, MySQL up):**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test && pnpm -C api test:e2e
```

**Commit:**

```sh
git add api/src/http/controllers/notices/routes.spec.ts
git commit -m "test(notices): e2e routes spec (admin CRUD + 404 + 400)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 6 — Seed (para um deploy real mostrar a tela)

O menu real é montado de `ProfileScreen` (membership) + grants. **Edite**
`api/prisma/seed.ts` em **quatro arrays** (todos têm que concordar).

No array `MODULES`:

```ts
{ key: 'notices', name: 'Notices', description: 'Notice board for members.', order: 3, is_system: false },
```

No array `SCREENS` (**`path` é obrigatório** — o filtro de menu descarta tela com `path` nulo):

```ts
{ key: 'notices.notices', name: 'Notices', module: 'notices', path: '/notices', description: 'Notice board for members.', order: 1, is_system: false },
```

No array `PERMISSIONS`:

```ts
{ screen: 'notices.notices', action: 'view', label: 'View' },
{ screen: 'notices.notices', action: 'create', label: 'Add' },
{ screen: 'notices.notices', action: 'edit', label: 'Edit' },
{ screen: 'notices.notices', action: 'delete', label: 'Remove' },
```

Em `PROFILE_GRANTS`, conceda a perfis **não-admin** (admin é role, bypassa tudo) — ex.:
`support` com CRUD completo, `gym-member`/`gym-manager` só `view`:

```ts
// no perfil support:
{ screen: 'notices.notices', ops: ['view', 'create', 'edit', 'delete'] },
// nos perfis gym-member e gym-manager:
{ screen: 'notices.notices', ops: ['view'] },
```

Aplique e verifique:

```sh
pnpm -C api seeddb
```

> ⚠️ **Pegadinha — admin é ROLE, não perfil.** Não existe "perfil admin" na seed; o
> admin (role) bypassa tudo. Para um **não-admin** ver a tela, ele precisa de
> **membership** (`ProfileScreen`) + grant `view`. Por isso a Fase 5 (e2e admin) não
> exercita isto — confira a seed rodando `seeddb` e olhando as linhas.

**Validação** (seed é dado, não toca rota → só o gate unit):

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```

**Commit:**

```sh
git add api/prisma/seed.ts
git commit -m "feat(notices): seed notices module + screen + permissions + grants" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

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

> ⚠️ **Pegadinha — senha no modo real ≠ mock.** Os usuários demo semeados usam
> `ADMIN_PASSWORD` do `api/.env` (ex.: `admin` `Admin@12345`), **não** o `Password1!` do
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

   ```sh
   git checkout master && git merge --no-ff feat/notices-backend
   ```
3. **Nunca dê push** — é o usuário quem faz.

## Resumo das fases (back)

| Fase | Entrega | Validação |
|------|---------|------|
| 1 | schema + migração + barrel | `lint+compile+test` |
| 2 | repositório (interface + 2 impls) | `lint+compile+test` |
| 3 | use-case + factory + unit spec | `lint+compile+test` |
| 4 | controllers + rotas + register | `lint+compile+test` |
| 5 | e2e das rotas | `+ test:e2e` |
| 6 | seed (módulo/tela/perms/grants) | `lint+compile+test` |
| 7 | trocar mock→real + revalidar | smoke manual |
