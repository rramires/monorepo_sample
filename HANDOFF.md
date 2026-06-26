# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **monorepo_sample — start Plan 2: backend error-code i18n.** Plan 1 (full
> frontend i18n, en-US + pt-BR) is DONE, merged + pushed. Now close the one
> remaining English seam: server-sent messages. Read `CLAUDE.md` (root + `api/` +
> `web/`) + `web/PROJECT.md` § Internationalization first.
>
> **Plan 2 goal:** the backend returns a stable error **`code`** per failure;
> the frontend maps `code` → localized text (en/pt-BR), replacing the raw
> `error.response.data.message` reads. Also decide the env password-pattern
> message (`VITE_PASSWORD_MESSAGE`, currently English).
>
> **Contract-first approach (discuss the taxonomy with me BEFORE coding):**
> 1. Add a stable error-`code` registry to `@root/contracts` — one code per
>    distinct API error (sweep `api/src` error responses: invalid credentials,
>    email/username exists, invalid/expired code, rate-limited, gym inactive,
>    409s, etc.). `contracts` gate: `pnpm -C packages/contracts typecheck`.
> 2. `api`: every error response carries `{ code, message }` (message stays the
>    English dev fallback). Gate `pnpm -C api lint && compile && test (+test:e2e
>    for routes)`.
> 3. `web`: new `errors` i18n namespace (en+pt) keyed by code; at each
>    `(isAxiosError(err) && err.response?.data?.message) || fallback` site, prefer
>    `t('errors:<code>')`, keeping a generic fallback for unmapped codes.
> 4. MSW mocks mirror the new `code` verbatim (they already mirror messages).
> 5. Gate green per step; `en` copy unchanged keeps unit+e2e green.
>
> **Discipline:** brainstorm with me first (one question at a time, pt-BR, no
> multiple-choice) to lock the code taxonomy + scope, THEN execute phase by phase.
> Per our standing agreement you may **merge** non-essential phases yourself
> (`--no-ff`), gate green before each commit, Conventional Commits ending
> `Co-Authored-By: Claude <noreply@anthropic.com>`. **Never `git push`** (only the
> user). Reply pt-BR; UI text in code via i18n; `web/docs/TUTORIAL_*` frozen.

## Current state

- **Branch:** `master` — clean. Stamp: `95d62b9` (2026-06-26), pushed.
- **Plan 1 — frontend i18n (en-US + pt-BR) — DONE + merged + PUSHED.** 7 phases
  (P1 infra+Zod maps+flag selector · P2 dates/date-fns · P3 auth · P4 account +
  shared `common:errors` · P5 check-ins+dashboard · P6 chrome `nav`+`catalog` /
  gyms / admin · P7 dev missing-key detection + 404/error + EN+PT docs) + a
  follow-up fix for the auth/register layout header buttons. The gitignored
  `PLAN.md` was removed after push.
- **i18n conventions:** namespaces `common, nav, catalog, auth, account,
  check-ins, gyms, admin` under `web/src/i18n/locales/{en,pt-BR}/`; typed keys;
  cross-ns `t` = `useTranslation(['<ns>','common'])`; Zod messages via
  `factory(t)` memoized on `i18n.language`; DB catalog via `t('catalog:…',{
  defaultValue })`; admin tables show the raw stored name (data).
- **Known English seams (Plan 2 target):** server `data.message` toasts +
  env `VITE_PASSWORD_MESSAGE`.
- **Backlog:** Plan 2 (above). Nothing else open.
- **Gates last green:** web unit 82 · web e2e 35 · api unit 119 · api e2e 238
  (api untouched this effort).

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
