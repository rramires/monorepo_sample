# PROJECT — monorepo architecture

Architecture reference for the **monorepo level** only: the workspace, the shared
contract, and how the two apps fit together. App internals live in their own
`PROJECT.md` files. _(pt-BR: [PROJECT-pt-BR.md](./PROJECT-pt-BR.md).)_

> This repo is a **model architecture** meant to be copied into real projects.
> The patterns below — single workspace, one shared Zod contract, mock-first
> frontend against a clean backend — are the point. Keep them when you copy it.

## 1. Layout

```
monorepo_sample/
├── api/                  backend — Fastify + Prisma + MySQL (solid_api_sample)
├── web/                  frontend — React 19 + Vite + Tailwind v4 + MSW
├── packages/
│   └── contracts/        @root/contracts — shared Zod schemas + types
├── pnpm-workspace.yaml   workspace definition + consolidated allowBuilds
├── package.json          private root (workspace scripts live here)
└── pnpm-lock.yaml        single lockfile for the whole workspace
```

- `api/` — the HTTP API and source of truth for the contract. Self-contained
  docs: `api/README*`, `api/PROJECT*`, `api/CLAUDE.md`, `api/HANDOFF.md`,
  `api/TODO.md`.
- `web/` — the client of `api/`, built **mock-first** (MSW) so the UI is
  developed and tested without the backend running. Docs: `web/README*`,
  `web/PROJECT*`, `web/CLAUDE.md`, `web/HANDOFF.md`, and the `web/TUTORIAL_*`
  build history.
- `packages/contracts/` — see its [README](./packages/contracts/README.md).

## 2. Single pnpm workspace

`pnpm-workspace.yaml` declares `packages: [api, web, packages/*]`. One
`pnpm install` at the root installs every project into a single hoisted
`node_modules` with **one root `pnpm-lock.yaml`**. Build-script permissions
(`allowBuilds`: prisma/esbuild for the api, msw for the web) are **consolidated
at the root**, not per-app.

Apps depend on the shared package with the workspace protocol:

```jsonc
// api/package.json and web/package.json
"dependencies": { "@root/contracts": "workspace:*" }
```

Per-app scripts are unchanged — run them in each folder (`cd api && pnpm dev`) or
from the root (`pnpm -C web test:run`). Only **install** moved to the root.

## 3. The shared contract ("Zod único")

The marquee pattern. One Zod definition feeds **runtime validation on both
sides** and the **TypeScript types** (`z.infer`). Full rules in the package
[README](./packages/contracts/README.md); the essence:

- **Share the wire shape** (`snake_case`, backend-permissive). UI refinements
  (confirm-password, lowercasing, localized messages) stay **local** and derive
  via `.pick()/.omit()/.extend()/.partial()`.
- **Env-driven rules are factories.** `makePasswordSchema({ min, pattern, … })`
  is shared; each side injects its env (`PASSWORD_*` on the backend,
  `VITE_PASSWORD_*` on the frontend) at call time.
- **Don't force equality where the apps differ** (query coercion, range
  refinements, the register username transform stay local).
- **Zero-build**: the package ships TypeScript source; both apps transpile it.

### Adoption flow (backend → frontend → MSW)

```
 @root/contracts  ──▶  api/ controllers      parse request bodies
        │
        ├──────────▶  web/ form PMs          build form schema, add UI refinements
        │
        └──────────▶  web/ MSW mocks         validate requests + parse responses
```

The backend is the source of truth, so it adopts first; the frontend forms
derive from the shared shape; the MSW mocks validate against the same contract so
they can't drift from the real API.

## 4. Backend (summary → `api/PROJECT.md`)

Fastify + Prisma + MySQL, SOLID/clean layering (controllers → use-cases →
repositories behind interfaces, wired by factories). JWT access token + httpOnly
refresh cookie, RBAC read from the DB, rate limiting + login lockout. Runs on
`:3333`; MySQL via `api/docker-compose.yml` (compose project `monorepo_sample`,
host `3306`). `pnpm -C api db:fresh` resets the DB and seeds the admin.

## 5. Frontend (summary → `web/PROJECT.md`)

React 19 + Vite + Tailwind v4 + shadcn. **Presentation Model** (`x.tsx` view +
`use-x-pm.ts` logic), 3-file Contexts for session/UI state, TanStack Query for
server state, `src/api` maps wire `snake_case` → camelCase models. **Mock-first**:
MSW mirrors the backend verbatim and is the default dev/test target
(`pnpm -C web dev:test`, `:5001`); the real API is wired last (`pnpm -C web dev`,
`:3001`).

## 6. Dev & gates

```sh
pnpm install                     # once, at the root — installs all projects

pnpm -C api db:fresh             # MySQL up + migrate + seed admin
pnpm -C api dev                  # backend  :3333
pnpm -C web dev:test             # frontend, MSW mock  :5001  (no backend needed)
pnpm -C web dev                  # frontend, real API  :3001  (needs api up)
```

Gate before every commit (on the touched app):

| App | Gate |
|-----|------|
| `api` | `pnpm -C api lint && pnpm -C api compile && pnpm -C api test` (+ `test:e2e` for HTTP) |
| `web` | `pnpm -C web lint && pnpm -C web build && pnpm -C web test:run` (+ `e2e` for flows) |
| `contracts` | `pnpm -C packages/contracts typecheck` |

Process doctrine (branch/commit/merge discipline) lives in
[CLAUDE.md](./CLAUDE.md) and the per-app `CLAUDE.md` files.
