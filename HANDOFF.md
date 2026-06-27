# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **monorepo_sample — Notices module DONE + on `master`; how-to guide + `make-tutorial`
> skill shipped.** Two small open items: (1) **push the `how-to-base` branch**
> (`git push -u origin how-to-base`) — it's the tutorial baseline (pre-Notices code +
> the guide); (2) **translate the how-to to EN** (`how-to/*-pt-BR.md` → `*.md` pair).
> Read `CLAUDE.md` (root + `api/` + `web/`) + this file before anything; pick the next
> task with me (one question at a time, pt-BR, no multiple-choice). Branch off
> `master`; gate green before each commit (`lint:fix && format && build/compile &&
> test`, + `test:e2e` for routes/flows); **never `git push`** (maintainer only).

## Current state

- **Branch:** `master` — clean. Latest stamp `f081b9b` (2026-06-27). Master pushed
  through the Notices feature + how-to. (`how-to-base` branch is local — **needs
  push**.)
- **Notices module — DONE, on `master`.** A full-stack example feature (gym notice
  board) the maintainer built by executing the how-to:
    - **front:** page/PM/dialog (`web/src/pages/app/notices/`), CRUD (title input +
      category Radix Select), menu + permission, i18n (en+pt), MSW mocks, unit + e2e.
    - **back:** `Notice` model + migration, repo (interface+in-memory+prisma),
      use-case+factory, 4 controllers + routes, seed (module/screen/perms/grants),
      unit + e2e.
    - **contracts:** `notices.ts` shared schemas. Gates green: web 86 unit / 37 e2e,
      api 125 unit / 242 e2e.
- **`how-to/` guide (pt-BR) — DELIVERED + refined.** `README-pt-BR` (orchestrator +
  git workflow + cross-cutting checklist) + `01-frontend-pt-BR` + `02-backend-pt-BR`.
  Built by the tutorial method (build example → write → re-execute via zero-context
  follower → fix → revert), then hardened during the maintainer's own execution: full
  file contents per step, "Na pasta X Crie Y" + `mkdir` for new folders, fenced
  commands, anchors only where order matters, reference links after code, validations
  use `lint:fix && format`. Linked from root `README*`.
- **`how-to-base` branch — tutorial baseline (NEEDS PUSH).** = pre-Notices code (fully
  prettier-formatted) + the final guide. Followers: `git checkout how-to-base`, follow
  the guide, `git diff how-to-base master` to compare. Maintenance: when the guide
  changes, re-validate + move the pointer (overlay current guide on a clean
  pre-feature state). README §"Ponto de partida" documents it.
- **Repo format debt cleaned once** (`style: prettier --write`, commit `f6985bb`) so
  `pnpm format` is churn-free (no-op on untouched files).
- **`make-tutorial` skill created** — `~/.claude/skills/make-tutorial/SKILL.md` +
  registered in global `~/.claude/CLAUDE.md`. Encodes this whole methodology.
- **i18n Plan 1 (frontend) + Plan 2 (backend error-code) — DONE, merged, pushed**
  (historical; both languages, `messageFromError`, `@root/contracts/errors.ts`).
- **Open:** push `how-to-base`; EN translation of the how-to.

## Working rules (pointer + guardrails)

Doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + [`web/CLAUDE.md`](./web/CLAUDE.md) +
[`api/CLAUDE.md`](./api/CLAUDE.md). Safety belt: **never `git push`** (only the
maintainer) · never commit without the gate green (`lint:fix && format && build &&
test`) · branch off `master`, `--no-ff` merge · docs-only may go straight to `master`
· confirm before anything irreversible. Reply pt-BR; UI text via i18n;
`web/docs/TUTORIAL_*` frozen.

## Deeper memory

`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (cache, Claude / same machine only). This file is the source of truth
for state.
