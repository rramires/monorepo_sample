# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **monorepo_sample — no effort in flight.** The i18n work (Plan 1 frontend +
> Plan 2 backend error-code) is **DONE, merged + pushed**. Read `CLAUDE.md`
> (root + `api/` + `web/`) before starting anything; pick the next task with me
> first (one question at a time, pt-BR, no multiple-choice). Branch off `master`,
> gate green before each commit, **never `git push`** (only the maintainer).

## Current state

- **Branch:** `master` — clean, synced with `origin/master`. Stamp: `86da78a`
  (2026-06-26), pushed.
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
- **Gates last green:** api 119 unit · 238 e2e · web 82 unit · 35 e2e.
- **Nothing open.**

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
