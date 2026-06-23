# monorepo_sample

A **model monorepo**: a Fastify/Prisma backend and a React/Vite frontend in one
pnpm workspace, sharing **one Zod contract** for request/response shapes and
types. Built to be copied into real projects — the structure and patterns are the
deliverable. _(pt-BR: [README-pt-BR.md](./README-pt-BR.md).)_

## What's inside

| Path | What |
|------|------|
| [`api/`](./api/README.md) | Backend — **Fastify + Prisma + MySQL** (`solid_api_sample`), JWT auth + RBAC, `:3333`. |
| [`web/`](./web/README.md) | Frontend — **React 19 + Vite + Tailwind v4 + shadcn + MSW**, mock-first, client of `api/`. |
| [`packages/contracts/`](./packages/contracts/README.md) | `@root/contracts` — shared **Zod schemas + types** ("Zod único"). |

Architecture: [PROJECT.md](./PROJECT.md). Working agreement for humans + AI:
[CLAUDE.md](./CLAUDE.md) / [AGENTS.md](./AGENTS.md) (and the per-app ones).

## Quickstart

Prereqs: Node, **pnpm**, Docker (for the backend's MySQL). Each app's `.env` is
gitignored — copy from the `.env.example` files before running.

```sh
# 1. Install the whole workspace (one command, at the root)
pnpm install

# 2. Frontend only — mock-first, no backend needed
pnpm -C web dev:test            # http://localhost:5001  (MSW mock)

# 3. Full stack — backend + frontend
pnpm -C api db:fresh            # MySQL up (Docker) + migrate + seed admin
pnpm -C api dev                 # backend            :3333
pnpm -C web dev                 # frontend, real API :3001
```

Default seeded admin (see `api/.env`): `admin@example.com` / `Admin@12345`.
In mock mode, any identifier + password `Password1!` signs in (`admin` → admin
screens).

## How it works (the short version)

- **One pnpm workspace.** `pnpm install` at the root installs `api`, `web`, and
  `packages/*` into a single `node_modules` with one lockfile. Per-app scripts
  run as before (`cd api && pnpm dev`, or `pnpm -C web test:run`).
- **One shared contract.** `@root/contracts` holds the **wire shape**
  (`snake_case`) as Zod schemas + `z.infer` types. The backend parses requests
  with it, the frontend forms derive from it, and the MSW mocks validate against
  it — so the three can't drift. UI-only refinements stay local to each app.
- **Mock-first frontend.** `web/` is developed and tested against MSW mirrors of
  the API; the real backend is wired last.
- **Access control (RBAC).** A hybrid role + dynamic-profile model spans both
  apps: the backend resolves effective per-screen permissions, the frontend gates
  nav, routes, and buttons from them. Detail in
  [`api/PROJECT.md`](./api/PROJECT.md) and [`web/PROJECT.md`](./web/PROJECT.md)
  (setup in the app `README*`).

Per-app setup, routes, env tables, and smoke tests are in each app's
`README*`/`PROJECT*`.

## Gates

Run on the app you touched before committing:

```sh
pnpm -C api  lint && pnpm -C api  compile  && pnpm -C api  test      # + test:e2e
pnpm -C web  lint && pnpm -C web  build    && pnpm -C web  test:run  # + e2e
pnpm -C packages/contracts typecheck
```
