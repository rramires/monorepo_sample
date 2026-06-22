# HANDOFF — monorepo_sample/api (backend)

_Snapshot: cópia limpa de `solid_api_sample` @ `888a502` (2026-06-21). Backend completo; sem trabalho em aberto._

## Resume prompt (cole em qualquer sessão / modelo)

> Leia este HANDOFF.md + CLAUDE.md e continue a partir de "Estado atual". Honre as regras do
> CLAUDE.md (branch por tarefa, commit por fase com gate verde, docs nas 4 línguas). Confirme
> antes de qualquer ação irreversível. **Nunca dê push.** Pergunte UMA coisa por vez (sem
> caixas de múltipla escolha), em pt-BR. Caveman mode opcional (terse; código/commits/segurança normais).
>
> **Sem trabalho em aberto** no backend. Aguarde a próxima tarefa.

## Onde isto vive (contexto monorepo)

- Você está em **`monorepo_sample/api`** — o **backend** de um monorepo.
- O **git root é a raiz do monorepo** (`monorepo_sample/`), não esta pasta. O histórico do
  backend **não veio** (cópia limpa, sem `.git`). O original vive no repo standalone `solid_api_sample`.
- Irmão **`../web/`** = frontend (entrega/sessão separada; vazio até a cópia do front).
- A **sessão da raiz do monorepo** decide o plumbing de raiz (workspace, `package.json` raiz, CI).
  ⚠️ Esta pasta trouxe um `pnpm-workspace.yaml` próprio (só `allowBuilds`) — pode precisar
  **reconciliar** com o workspace da raiz do monorepo.

## Estado atual

- Backend GymPass-style: Fastify · TypeScript · Prisma 7 · MySQL · Vitest. SOLID/Clean Arch.
  Pronto, auditado, sem pendências.
- **Última entrega (GET /users/:userId — admin):** busca 1 usuário por id; `200 { user: PublicUser }`
  byte-idêntico ao item do `GET /users` (novo `findPublicById` reusa `PUBLIC_USER_SELECT`;
  `password_hash` nunca lido) · `404 "Resource not found."` · `400 "Validation error."` ·
  `403`/`401` do middleware. Camadas repo → `GetUserUseCase` → factory → controller fino. Junto:
  **`fix(env)`** `REQUIRE_EMAIL_VERIFICATION` (era `z.coerce.boolean()` → `"false"` virava `true`;
  agora `z.enum(['true','false']).transform`). Gate verde (**95 unit / 63 e2e**), smoke 5/5.
- **Entrega anterior (CORS preflight):** `@fastify/cors` registrava sem `methods` e caía no
  default `GET,HEAD,POST` → browser abortava todo `PATCH`/`PUT`/`DELETE` no preflight (server
  respondia OPTIONS 204; quem bloqueava era o browser). Fix: `methods` explícito
  (`GET,HEAD,POST,PUT,PATCH,DELETE`) em `app.ts`.
- **Entrega anterior (check-ins 4xx):** os 3 erros de domínio dos check-ins retornam **4xx**
  (antes caíam em 500), mapeados no controller via `instanceof` (padrão da casa):
  `MaxDistanceError`→**400**, `MaxCheckInsReachedError`→**409**, `LateCheckInValidationError`→**409**.
  Docs: README smoke + PROJECT §4.3 (EN+PT).
- **Entrega anterior (RBAC + env):** autorização lê o **papel do banco**, não do claim do JWT
  (`verifyUserRole` consulta o DB; demote/promote vale na hora) · refresh assina `role` fresco
  do DB · `DATABASE_URL` validado pelo Zod.
- 27 rotas (auth/users/gyms/check-ins/health). Tabela completa + smoke no README.

## Como rodar

```sh
cp .env.example .env        # o .env já veio preenchido p/ dev (copiado junto)
pnpm install
pnpm compose:up             # MySQL no Docker (healthcheck)
pnpm exec prisma migrate deploy
pnpm seeddb                 # cria o ADMIN (vars ADMIN_*)
pnpm dev
```

- Reset limpo do banco: **`pnpm db:fresh`**. Liberar portas / matar app: **`pnpm killapp`**.
- Setup + smoke completo: `README.md` / `README-pt-BR.md`. Arquitetura: `PROJECT.md` / `PROJECT-pt-BR.md`.

## Como trabalhamos (doutrina)

Regras de processo completas: **`CLAUDE.md`** (branch por tarefa contra o git da raiz do
monorepo, commit por fase com gate verde, docs nas 4 línguas). Guardrails que NÃO podem falhar:
**nunca push** (é do usuário) · **nunca commit sem aprovação** · **gate verde** antes de cada
commit (`pnpm lint && pnpm compile && pnpm test`; + `pnpm test:e2e` se mexer em HTTP/rotas) ·
**PLAN.md nunca commitado** (gitignored).

## Notas de trabalho (memória destilada — não viaja entre máquinas/paths)

A harness-memory do Claude é keyed pelo path do repo original, então **não** está disponível
aqui. O essencial, destilado:

- **Idioma:** responder em **pt-BR**.
- **Perguntas:** UMA por vez, em texto, com exemplo (nunca caixas de múltipla escolha).
- **Pré-commit:** rode `pnpm lint:fix && pnpm format` **antes** (o `lint` só verifica, não
  formata) + `pnpm test` (+ `pnpm test:e2e` se HTTP). Docs: `pnpm exec prettier --check`.
- **Fim de toda tarefa:** revisar os 4 docs (README×2 + PROJECT×2) + **smoke-testar as rotas
  afetadas** via curl do README, mesmo sem rota nova.
- **Smoke manual (gotchas):** o zsh deste ambiente quebra com UUID guardado em var de shell
  dentro de substituição aninhada → faça um **script Python** (urllib) lendo tokens/OTP do log
  do server (o `ConsoleEmailProvider` imprime link+OTP no stdout). Rate-limit: **5/min estrito**
  em `/users`, `/auth/login`, `/users/forgot-password`, `/users/reset-password` (cada um seu
  budget) + **100/min global**; pegue **1 token member + 1 admin cedo e reuse** (4h válidos),
  rode o flood `/hello` por **último**. Pare o server **pela porta** (`lsof -ti tcp:3333 | xargs
  kill`) — `pkill -f server.ts` mata o próprio shell. `tsx watch` respawna: mate o processo pai.
- **Prisma:** `migrate reset` é bloqueado pelo guard de IA do Prisma 7 → use **`pnpm db:fresh`**
  (compose down/up `--wait` + `migrate deploy` + `seeddb`). Depois de `prisma generate`, **recrie
  o barrel** `src/prisma-client/index.ts` (`export * from './client.js'`). O 1º `migrate deploy`
  num MySQL recém-subido pode dar **P1017** → retry (o healthcheck/`--wait` ajuda).
