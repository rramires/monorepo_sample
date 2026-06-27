# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **monorepo_sample — HOW-TO guide delivered, awaiting your review + push.** The
> `how-to/` guide (front-first, pt-BR: `README-pt-BR` + `01-frontend-pt-BR` +
> `02-backend-pt-BR`) teaches adding a new full-stack feature. It is **committed
> to `master` (docs-only, UNPUSHED — `65a4458`)**. It was validated by building an
> example "Notices" module end-to-end (all gates green) and re-executing the docs
> from a clean checkout (smoke; 5 defects found + fixed). The example **code is
> NOT on `master`** — it lives on the unmerged branch `example/notices-reference`.
> Next: (1) review `how-to/` and run it yourself to build the real Notices +
> commit your version; (2) translate to EN (`*-pt-BR.md` → `*.md` pair) when
> happy; (3) `git push` (only you). Read `CLAUDE.md` (root + `api/` + `web/`)
> first; one question at a time, pt-BR. Branch off `master`, gate green before
> each commit, **never `git push`**.

## Current state

- **Branch:** `master` — clean. Stamp: `65a4458` (2026-06-27), **UNPUSHED**
  (`origin/master` at `378b9ca`; only the maintainer pushes).
- **HOW-TO guide — delivered, awaiting review + push.** `how-to/` (pt-BR:
  `README-pt-BR` + `01-frontend-pt-BR` + `02-backend-pt-BR`) = front-first guide to
  adding a full-stack feature (contract → API client + MSW mock → menu/permission
  wiring → i18n → page/PM/dialog → tests → smoke; then back: migration → repo →
  use-case → controllers/routes → e2e → seed → swap mock→real). Linked from root
  `README*`. Validated by building example **"Notices"** end-to-end (web 86 unit /
  37 e2e, api 125 unit / 242 e2e — all green) then a clean-checkout smoke rebuild
  (5 doc defects found + fixed). The Notices **code is NOT on `master`**; it lives
  on the unmerged branch **`example/notices-reference`** (12 phase commits) as a
  living reference. Open: maintainer reviews/runs the guide, then EN translation,
  then push.
- **i18n Plan 1 — frontend (en-US + pt-BR) — DONE + merged + pushed.** Namespaces
  under `web/src/i18n/locales/{en,pt-BR}/`; typed keys; Zod via `factory(t)`;
  dates via `lib/datetime.ts`; flag selector; dev missing-key guard.
- **i18n Plan 2 — backend error-code i18n — DONE + merged + pushed.** Closed the
  last English seam (server-sent messages):
    - **contracts:** `errors.ts` — `ERROR_CODES`, `errorCodeSchema`,
      `errorMetaSchema` (`retryAfter`/`count`/`action`), `errorResponseSchema`.
    - **api:** base `AppError` (code + httpStatus + meta); every domain error
      extends it; new `Unauthorized`/`Forbidden`/`EmailNotVerified`/
      `ScreenUnavailable` thrown from middlewares; `setErrorHandler` is the single
      `{ code, message, meta? }` serializer; redundant controller `try/catch`
      removed (errors propagate).
    - **web:** `errors` i18n namespace (en + pt-BR, keys = codes); `lib/errors.ts`
      `messageFromError(err, fallback)`; ~22 call-sites consume it; password hint →
      `common:errors.passwordPattern`; `VITE_PASSWORD_MESSAGE` retired
      (`VITE_PASSWORD_PATTERN` stays). MSW mocks mirror `code` + `meta`.
    - **note:** one code added beyond the original brainstorm registry —
      `screen_unavailable` (403, the `require-screen` kill-switch case).
- **Gates last green (with Notices, on `example/notices-reference`):** api 125 unit
  · 242 e2e · web 86 unit · 37 e2e. (`master` baseline without Notices: api 119/238
  · web 82/35.)
- **Open:** maintainer reviews/runs `how-to/`, builds the real Notices + commits;
  then EN translation of the guide; then push. The HOW-TO commit `65a4458` is
  **unpushed** — push to be disaster-safe.

## Working rules (pointer + guardrails)

Doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + [`web/CLAUDE.md`](./web/CLAUDE.md) +
[`api/CLAUDE.md`](./api/CLAUDE.md). Safety belt: **never `git push`** (only the
maintainer) · never commit without the gate green · branch off `master`, `--no-ff`
merge · docs-only may go straight to `master` · confirm before anything
irreversible. Phases may be merged autonomously per the standing agreement; STOP
for the user's browser test on route-/form-touching changes. Reply pt-BR; UI text
via i18n; `web/docs/TUTORIAL_*` frozen.

## Deeper memory

`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (cache, Claude / same machine only). This file is the source of truth
for state.
