# PROJECT — arquitetura do monorepo

Referência de arquitetura **só no nível do monorepo**: o workspace, o contrato
compartilhado e como os dois apps se encaixam. Os internos de cada app vivem nos
`PROJECT.md` deles. _(EN: [PROJECT.md](./PROJECT.md).)_

> Este repo é uma **arquitetura modelo** pra ser copiada em projetos reais. Os
> padrões abaixo — workspace único, um contrato Zod compartilhado, frontend
> mock-first sobre um backend limpo — são o ponto. Mantenha-os ao copiar.

## 1. Layout

```
monorepo_sample/
├── api/                  backend — Fastify + Prisma + MySQL (solid_api_sample)
├── web/                  frontend — React 19 + Vite + Tailwind v4 + MSW
├── packages/
│   └── contracts/        @root/contracts — schemas Zod + tipos compartilhados
├── pnpm-workspace.yaml   definição do workspace + allowBuilds consolidado
├── package.json          root privado (scripts de workspace aqui)
└── pnpm-lock.yaml        lockfile único do workspace inteiro
```

- `api/` — a API HTTP e fonte da verdade do contrato. Docs próprios:
  `api/README*`, `api/PROJECT*`, `api/CLAUDE.md`, `api/HANDOFF.md`, `api/TODO.md`.
- `web/` — cliente do `api/`, construído **mock-first** (MSW) pra UI ser
  desenvolvida e testada sem o backend de pé. Docs: `web/README*`,
  `web/PROJECT*`, `web/CLAUDE.md`, `web/HANDOFF.md` e o histórico
  `web/TUTORIAL_*`.
- `packages/contracts/` — veja o [README](./packages/contracts/README-pt-BR.md).

## 2. Workspace pnpm único

`pnpm-workspace.yaml` declara `packages: [api, web, packages/*]`. Um
`pnpm install` na raiz instala todos os projetos num `node_modules` único
(hoisted) com **um `pnpm-lock.yaml` na raiz**. Permissões de build-script
(`allowBuilds`: prisma/esbuild do api, msw do web) ficam **consolidadas na raiz**,
não por app.

Os apps dependem do pacote compartilhado via workspace protocol:

```jsonc
// api/package.json e web/package.json
"dependencies": { "@root/contracts": "workspace:*" }
```

Os scripts por app não mudaram — rode em cada pasta (`cd api && pnpm dev`) ou da
raiz (`pnpm -C web test:run`). Só o **install** virou raiz.

## 3. O contrato compartilhado ("Zod único")

O padrão central. Uma definição Zod alimenta **validação em runtime nos dois
lados** e os **tipos TypeScript** (`z.infer`). Regras completas no
[README](./packages/contracts/README-pt-BR.md) do pacote; a essência:

- **Compartilhe a forma do fio** (`snake_case`, permissivo como o backend).
  Refinamentos de UI (confirmar-senha, lowercase, mensagens localizadas) ficam
  **locais** e derivam via `.pick()/.omit()/.extend()/.partial()`.
- **Regras por env são fábricas.** `makePasswordSchema({ min, pattern, … })` é
  compartilhado; cada lado injeta seu env (`PASSWORD_*` no backend,
  `VITE_PASSWORD_*` no frontend) na chamada.
- **Não force igualdade onde os apps diferem** (coerção de query, refinamentos de
  range, o `transform` do username no register ficam locais).
- **Zero-build**: o pacote entrega TypeScript-fonte; os dois apps transpilam.

### Fluxo de adoção (backend → frontend → MSW)

```
 @root/contracts  ──▶  api/ controllers      parse dos bodies de request
        │
        ├──────────▶  web/ PMs de form       monta schema, soma refinamento de UI
        │
        └──────────▶  web/ mocks MSW         valida requests + parse de respostas
```

O backend é a fonte da verdade, então adota primeiro; os forms do frontend
derivam da forma compartilhada; os mocks MSW validam contra o mesmo contrato pra
não divergirem da API real.

## 4. Backend (resumo → `api/PROJECT-pt-BR.md`)

Fastify + Prisma + MySQL, camadas SOLID/clean (controllers → use-cases →
repositories atrás de interfaces, montados por factories). JWT access token +
refresh cookie httpOnly, RBAC lido do DB, rate limiting + lockout de login. Roda
em `:3333`; MySQL via `api/docker-compose.yml` (projeto compose `monorepo_sample`,
host `3306`). `pnpm -C api db:fresh` reseta o DB e semeia o admin.

## 5. Frontend (resumo → `web/PROJECT-pt-BR.md`)

React 19 + Vite + Tailwind v4 + shadcn. **Presentation Model** (view `x.tsx` +
lógica `use-x-pm.ts`), Contexts de 3 arquivos pra estado de sessão/UI, TanStack
Query pra estado de servidor, `src/api` mapeia `snake_case` do fio → models
camelCase. **Mock-first**: MSW espelha o backend verbatim e é o alvo padrão de
dev/test (`pnpm -C web dev:test`, `:5001`); a API real é ligada por último
(`pnpm -C web dev`, `:3001`).

## 6. Dev & gates

```sh
pnpm install                     # uma vez, na raiz — instala todos os projetos

pnpm -C api db:fresh             # MySQL up + migrate + seed admin
pnpm -C api dev                  # backend  :3333
pnpm -C web dev:test             # frontend, mock MSW  :5001  (sem backend)
pnpm -C web dev                  # frontend, API real  :3001  (precisa api up)
```

Gate antes de cada commit (no app tocado):

| App | Gate |
|-----|------|
| `api` | `pnpm -C api lint && pnpm -C api compile && pnpm -C api test` (+ `test:e2e` pra HTTP) |
| `web` | `pnpm -C web lint && pnpm -C web build && pnpm -C web test:run` (+ `e2e` pra fluxos) |
| `contracts` | `pnpm -C packages/contracts typecheck` |

Doutrina de processo (disciplina branch/commit/merge) está em
[CLAUDE.md](./CLAUDE.md) e nos `CLAUDE.md` de cada app.
