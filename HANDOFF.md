# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **monorepo_sample — nothing open.** The web PM-audit refactor, both deferred web
> fixes (F1 auth StrictMode, F2 RequireScreen isFetching), and the fine-grained
> RBAC work are all merged into `master` and pushed. Read `CLAUDE.md` (root +
> `api/` + `web/`) before touching code. Start from a clean `master`: branch off
> it per task, gate green before each commit (`pnpm -C web lint && build &&
> test:run`, `+test:e2e` for flows; `pnpm -C api lint && compile && test`,
> `+test:e2e` for routes), commit per phase, **never `git push`** (the maintainer
> pushes), STOP for the user's browser test + `--no-ff` merge. Reply in pt-BR; UI
> text in code = English; `web/docs/TUTORIAL_*` are frozen.

## Current state

- **Branch:** `master` — clean, synced (`origin/master` = `3a342f9`, 2026-06-26).
- **PM audit (web) — DONE + merged + pushed** (merge `3a214ae`): every view with
  logic is now `const pm = useXxxPM()` + render (scope A+B+D + Tier C). Folded in
  **F2** (require-screen gates on `isFetching`). Plus 2 UX feats: screens
  Inactive/Off badges, account+sign-out in the collapsed sidebar rail. Docs moved
  to the **flat PM-pair** convention (`6c51f67`).
- **F1 — auth boot × StrictMode — DONE + merged + pushed** (merge `3a342f9`):
  boot uses the single-flight `refreshAccessToken()`; dead `api/refresh.ts`
  removed; `lib/api.spec.ts` covers the dedup. F5-logout gone (verified in dev).
- **RBAC fine-grained — DONE + merged + pushed** (`6d61a64`): free-key actions,
  server-side enforcement on every route + security battery.
- **Backlog: empty.** No open bugs or deferred fixes.
- **Gates last green:** web unit 71 · web e2e 35 · api unit 119 · api e2e 238.

## Working rules (pointer + guardrails)

Doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + [`web/CLAUDE.md`](./web/CLAUDE.md) +
[`api/CLAUDE.md`](./api/CLAUDE.md). Safety belt: **never `git push`** (only the
maintainer) · never commit without the gate green · branch off `master`, `--no-ff`
merge after the user authorizes · docs-only may go straight to `master` · STOP at
the end for the user's browser test. Reply pt-BR; UI text in code = English;
`web/docs/TUTORIAL_*` frozen.

## Deeper memory

`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md`. A cache (Claude / same machine only) — this file is the source of
truth for state.
