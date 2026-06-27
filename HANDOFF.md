# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **monorepo_sample — execute Plan 2: backend error-code i18n.** Brainstorm is
> DONE, taxonomy + scope are LOCKED, and the full phased plan is written to
> **`PLAN.md`** (repo root, gitignored — same machine). Read `PLAN.md` first, then
> `CLAUDE.md` (root + `api/` + `web/`). Start at **P1 (contracts)**.
>
> **Goal:** close the last English seam — server-sent messages. Backend returns a
> stable error **`code`** (+ optional `meta`) per failure; the frontend maps
> `code` → localized text (en/pt-BR), replacing the raw
> `error.response.data.message` reads. Also retire `VITE_PASSWORD_MESSAGE`.
>
> **Locked decisions:** (1) **one code per error class**, generics stay generic
> (`resource_not_found`/`unauthorized`/`forbidden`/`validation_error`), codes in
> `snake_case`. (2) Uniform envelope **`{ code, message, meta? }`**; dynamic data
> (`retryAfter`/`count`/`action`) lives in `meta`; `message` is the EN dev
> fallback; the current top-level `retryAfter` moves into `meta`. (3) Backend =
> base **`AppError`** (`code`+`httpStatus`+`meta`) + central `setErrorHandler`
> serialization; **delete** the redundant per-controller `try/catch`; new
> `Unauthorized`/`Forbidden`/`EmailNotVerified` errors thrown from middlewares.
> (4) Password hint → **`common:errors.passwordPattern`** (en+pt), `VITE_PASSWORD_MESSAGE`
> removed; `VITE_PASSWORD_PATTERN` stays env; `.env.example` comment points at the key.
>
> **Phases (full detail + the code registry table in `PLAN.md`):** P1 contracts
> (`errors.ts`: `ERROR_CODES`/`errorCodeSchema`/`errorMetaSchema`/`errorResponseSchema`)
> · P2 api (AppError base + every class + middleware error classes + central
> handler + delete catches) · P3 web (`errors` namespace keyed by code + a
> `messageFromError(err, fallback)` helper on global `i18n` + replace the 23
> call-sites + password hint/env) · P4 MSW mocks mirror `code`+`meta` · P5 docs
> (en+pt) · final manual walkthrough.
>
> **Discipline:** contract-first order contracts→api→web→MSW, **green gate before
> each commit**, `en` i18n values = exact current English (keeps suites green).
> Per the standing agreement you may **merge** non-essential phases yourself
> (`--no-ff`); STOP for the user's browser smoke on route-/form-touching changes.
> Conventional Commits ending `Co-Authored-By: Claude <noreply@anthropic.com>`.
> **Never `git push`** (only the user). Reply pt-BR; `web/docs/TUTORIAL_*` frozen.
> Delete `PLAN.md` only after every phase is verified.

## Current state

- **Branch:** `master` — clean. Stamp: `5385f9d` (2026-06-26), pushed.
- **Plan 1 — frontend i18n (en-US + pt-BR) — DONE + merged + PUSHED.** Namespaces
  `common, nav, catalog, auth, account, check-ins, gyms, admin` under
  `web/src/i18n/locales/{en,pt-BR}/`; typed keys; Zod via `factory(t)` memoized on
  `i18n.language`; dates via `lib/datetime.ts`; flag selector; dev missing-key.
- **Plan 2 — backend error-code i18n — PLANNED, not started.** Brainstorm done,
  taxonomy + scope locked; phased plan in gitignored `PLAN.md`. Resume prompt above.
- **Gates last green:** web unit 82 · web e2e 35 · api unit 119 · api e2e 238.

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
