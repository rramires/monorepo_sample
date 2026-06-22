# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (copy-paste into a new session)

> Read `HANDOFF.md` + `CLAUDE.md` at the repo root, then continue from **Current
> state** below. This is the `monorepo_sample` model repo: `api/` (Fastify+Prisma+
> MySQL) + `web/` (React+Vite+MSW) + `packages/contracts/` (`@root/contracts`,
> shared Zod). One pnpm workspace — `pnpm install` at the root; run scripts per app
> (`pnpm -C api …` / `pnpm -C web …`). Gate the touched app green before each
> commit; work on a local branch off `master` (docs-only may go straight to
> `master`); **never `git push`** (the user pushes); confirm before anything
> irreversible. The core delivery (workspace + shared contract + docs + CI) is
> DONE — see Current state for the only loose end.

## Current state

- **Branch:** `master` · **commit:** `eac0274` (2026-06-22) · in sync with `origin/master`.
- **Working tree:** clean.
- **Delivered (all merged + pushed):**
  - Single **pnpm workspace** (one root lockfile + consolidated `allowBuilds`).
  - **`@root/contracts`** — shared Zod schemas + `z.infer` types; adopted
    backend → frontend forms → MSW (wire shape shared, UI refinements local,
    env-driven rules are factories). Zero-build (source exports).
  - **Hybrid docs (EN+PT):** root README/PROJECT/CLAUDE/AGENTS orient + point;
    apps keep their own; `packages/contracts/README` is the pattern guide.
  - **Monorepo CI** at root `.github/workflows/` (`api.yml` + `web.yml`,
    path-filtered, Node-24 action majors). Green on GitHub.
  - Cleanups: `api/TODO.md` removed; web tutorials → `web/docs/`; `.vscode/`
    tracked; jest-dom typing fixed for Vitest 4 (`web/test/vitest.d.ts`).
- **In-flight:** none.
- **Loose end (user's — never push myself):** delete the leftover remote branch
  `origin/ci/monorepo-workflows` → `git push origin --delete ci/monorepo-workflows`.
- **Possible future work:** deeper contract adoption (gym/check-in/search schemas
  were intentionally left local where the apps legitimately differ).

## Working rules

Full doctrine in [`CLAUDE.md`](./CLAUDE.md) (+ per-app `api/CLAUDE.md`,
`web/CLAUDE.md`). Irreversible guardrails (safety belt):

- **Never `git push`** — the user pushes.
- **Never commit without approval**; work on a branch off `master` (docs-only may
  go straight to `master`).
- **Gate green before every commit** (lint + compile/build + test on the touched
  app; `packages/contracts` typecheck).
- **Confirm before anything irreversible** (delete/move/overwrite) — list first.

## Deeper memory

Harness memory (Claude / same machine only):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (e.g. autonomous phase-execution preference).
