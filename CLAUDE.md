# CLAUDE.md — working agreement (monorepo root)

For AI assistants **and** humans working at the monorepo root. App-specific
doctrine lives in [`api/CLAUDE.md`](./api/CLAUDE.md) and
[`web/CLAUDE.md`](./web/CLAUDE.md) — **read the one for the app you touch.** This
file covers what is **common** and what is **monorepo-level**.

> This repo is a **model architecture** to be copied into real projects. Keeping
> the patterns and this discipline intact is part of the job.

## Layout & where things live

- `api/` — backend (Fastify + Prisma + MySQL). Process: `api/CLAUDE.md`.
- `web/` — frontend (React + Vite + MSW), mock-first. Process: `web/CLAUDE.md`.
- `packages/contracts/` — `@root/contracts`, shared Zod schemas. Rules:
  [`packages/contracts/README.md`](./packages/contracts/README.md).
- Architecture overview: [`PROJECT.md`](./PROJECT.md).

## Workspace rules

- **One install, at the root:** `pnpm install`. Do **not** reintroduce per-app
  `pnpm-lock.yaml` or per-app `pnpm-workspace.yaml` — there is a single root
  lockfile and a single `pnpm-workspace.yaml` (with consolidated `allowBuilds`).
- **Run scripts per app**, from the folder (`cd web && pnpm test:run`) or with
  `-C` from the root (`pnpm -C api dev`). Apps depend on the shared package via
  `"@root/contracts": "workspace:*"`.

## The shared contract (must follow)

When changing request/response shapes, think contract-first:

- **Share the wire shape** (`snake_case`) in `@root/contracts`; keep UI-only
  refinements (confirm-password, lowercasing, localized messages) **local**,
  derived with `.pick()/.omit()/.extend()/.partial()`.
- **Don't force equality** where the apps legitimately differ (query coercion,
  range refinements, the register username transform stay local).
- **Env-driven rules are factories** — inject env per side, never at import.
- Adopt in order **backend → frontend → MSW**, with **green gates per step**.

## Methodology — mock-first, end to end (the build flow)

New screens, changes and features are built **mock-first**, in this order — it is the
**rule**, not a preference (the [`how-to/`](./how-to/) guide is the worked example):

1. **Front first.** Build the UI against the **MSW mock** until it works end-to-end at
   `pnpm -C web dev:test` (`:5001`). **Stop and let the user smoke it in the browser and
   approve** before any backend work.
2. **Backend second, in-memory first.** Implement the **in-memory repository first**, get
   the use-case **unit-green** against it, **then** write the Prisma repository and wire the
   real route. Swap the mock for the real API **last** and re-validate the same screen.

## Golden workflow (every change) — local, no PR

1. **Local branch off `master`.** Never commit **code** to `master` directly.
   - **Exception — docs-only** (`README*`, `PROJECT*`, `CLAUDE.md`, `AGENTS.md`,
     the contracts `README*`, with **no code**) may go straight to
     `master` as their own `docs:` commit.
2. **Commit per phase** — one coherent step, right after its gate passes.
   Conventional Commits. Stage narrowly. Never leave a finished phase
   uncommitted; never batch unrelated work.
3. **Gate before every commit** (touched app must be green). **Always run
   `lint:fix` then `format` first**, then the build/compile + tests — never plain
   `lint`:

   | App | Gate |
   |-----|------|
   | `api` | `pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test` (+ `test:e2e` for HTTP/routes) |
   | `web` | `pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run` (+ `test:e2e` for flows) |
   | `contracts` | `pnpm -C packages/contracts typecheck` |

   > **Why `lint:fix && format`, always.** `lint:fix` applies auto-fixes (e.g.
   > `simple-import-sort` — plain `lint` only *reports* unsorted imports and fails);
   > `format` (Prettier) normalizes style. If you skip `format`, opening a file in
   > VSCode later lets **autosave reformat it** and that reformat lands in a later
   > diff, polluting commits. Running both before every commit keeps the tree
   > already-formatted so the gate and CI stay clean.

4. **When done, STOP for the user.** The user tests in the browser (for
   route-/form-touching changes) and **authorizes the merge**; only then merge
   locally (`git checkout master && git merge <branch>`).
   - **Only the user pushes.** Never run `git push`. Delete the local branch
     after the user pushes and confirms.

## Commit messages

Conventional Commits matching the change (`feat(scope):`, `fix(scope):`,
`refactor:`, `test:`, `docs:`, `chore:`). Docs get their own `docs:` commit. End
every commit with:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Docs strategy (hybrid)

Each app keeps its **own** full doc set (`README*`, `PROJECT*`, `CLAUDE.md`,
`AGENTS.md`). State lives in the root `HANDOFF.md`
(single checkpoint). The root only **orients and
points** — it does not duplicate app internals. Project docs are **EN + PT**
(`README.md` + `README-pt-BR.md`, `PROJECT.md` + `PROJECT-pt-BR.md`). Finish a
change with a docs review: confirm the touched app's docs still match the code.

## Doctrine (always)

- Ask **one question at a time**, in pt-BR, no multiple-choice boxes.
- Confirm before anything **irreversible** (delete/move/overwrite) — list it
  first.
- `.env` is gitignored in both apps; only `.env.example` is committed. Never
  commit a secret.
- UI text in code = English; conversation/tutorial prose = pt-BR.
