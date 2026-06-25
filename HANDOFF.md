# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Sessão de **execução**. Lê `PLAN.md` (raiz — spec completa, local/gitignored) +
> `HANDOFF.md` + `CLAUDE.md` do monorepo `monorepo_sample`. Tarefa: **RBAC
> permissions redesign** — labels amigáveis + ops **curadas por tela** + **3
> eixos** (grant RBAC / kill switch `Screen.is_enabled` / disable `is_active`) +
> **delete sem cascade** (409 quando em uso). Modelo: tabela `permissions`
> (`screen_id, action, label`) + junção `profile_permissions` + `profile_screens`
> vira **membership** + `Profile.default_screen_id`. Admin bypassa tudo.
>
> **Frontend-first com MSW**, depois API espelha (status/`message` verbatim).
> Executa **fase a fase do PLAN** (G0 contracts → G1–G4 web+MSW → G5–G8 api → G9
> docs → Final), **gate verde + commit por fase** (web: `pnpm -C web lint:fix &&
> pnpm -C web format` antes; gates no `CLAUDE.md`). Branch local
> `feat/rbac-permissions` off `master`. **NÃO pushar** (só o usuário). **PARA** no
> Final pro teste no browser + merge `--no-ff`. Confirma antes de irreversível.
> Responde em pt-BR; UI em inglês. `web/docs/TUTORIAL_*` congelado. Backlog
> separado (NÃO agora): fresta do `RequireScreen` (`isFetching`).

## Current state

- **Branch:** `master` — clean, **all pushed** (responsive pass + its docs).
  Stamp: 2026-06-25.
- **▶ NEXT (planned, not started): RBAC permissions redesign.** Design **locked
  with the user**; full execution spec in **`PLAN.md`** (root, gitignored — local
  only). Build **frontend-first with MSW**, then mirror the API. Start at **G0
  (contracts)**, one local branch `feat/rbac-permissions`, gate+commit per phase,
  STOP at Final for browser test + merge. Gist:
  - New `permissions` table (`screen_id`, `action`, `label`) + `profile_permissions`
    M:N; `profile_screens` → **membership**; `Profile.default_screen_id` replaces
    the per-grant `is_default`. **Friendly labels** + **curated ops** per screen
    (e.g. Check-in = view + "Check in" only — no phantom Edit/Delete).
  - **3 axes:** grant (RBAC) · **kill switch** `Screen.is_enabled` (runtime, "This
    screen is temporarily unavailable.") · **disable** `is_active` on
    Module/Screen/Profile (lifecycle: hidden from "add" below, existing keep).
    Admin bypasses all. `view` becomes an explicit grant (no more default-true).
  - **Delete = no cascade** → 409 when in use (+ `is_system`); else Disable.
  - Two Forbidden messages: no-view → "You don't have access to this screen yet.";
    killed → "This screen is temporarily unavailable."
  - Backlog (separate, not in this package): `RequireScreen` `isFetching` gap.
- **Done + merged + pushed — access-control follow-up package COMPLETE (G0–G6):**
  - **G0** web e2e scripts → `test:e2e`. **G1** `is_system` on Module+Screen
    (delete/key-rename → 409; screen locks module+path; read-only edit fields).
    **G2** reusable confirm-on-deactivate (`useConfirmDeactivate` + controlled
    `ConfirmDialog`) + user-edit retrofit. **G3** gym soft-delete
    (`Gym.is_active`; check-in inactive → 403; member active-only; manager full
    non-geo list + Nearby/Show-deactivated toggles + pager page-size 8).
  - **G4** header breadcrumb (`components/breadcrumb/`; static trail + dynamic
    leaf via `useSetBreadcrumb`; lone top-level crumb muted) + sidebar active
    segment-match (`isItemActive`) + shared **`PageHeader`** (`text-xl`) on all
    pages.
  - **G5** grants module filter — lean **`MultiSelect`** (`ui/multi-select.tsx` =
    radix Popover + `ui/command.tsx`/cmdk + Badge) above the untouched
    `TransferTable`, wired to the Available side; **Module column on both sides**;
    rows enriched with `moduleKey`/`moduleName` (`ScreenRow` in
    `use-profile-detail-pm.ts`). Empty filter = no filter; granted screens always
    kept so Granted never loses rows.
  - **G6** closed `api/PROJECT.md` §4.1 request-lifecycle graph (steps 10–13) +
    final EN+PT doc sweep (no drift).
- **After the package — also done + merged + pushed:**
  - `feat/form-autofocus` (web) — forms autofocus their first field on mount
    (auth screens + new-gym / user-edit / profile-detail; admin dialogs already
    do via Radix's focus scope) and the sign-in "Forgot your password?" link
    moved below the Sign in button (tab order identifier → password → Sign in →
    Forgot). Docs EN+PT.
  - `feat/default-profile-invariant` (api + web) — exactly one `is_default`
    profile: setting one demotes the rest (radio, `clearDefaultExcept`), turning
    the current default off → 409 (`DefaultProfileRequiredError`); the
    profile-detail Default switch is disabled when already default and confirms
    before replacing the current default on promote. Specs/e2e + docs EN+PT.
  - `chore/sidebar-module-order` — the data-driven sidebar lists **Gym before
    Access Control** (swapped module `order` in the backend seed + MSW mock;
    landing unaffected).
- **Responsive pass (web) — DONE + merged.** 3 bands (mobile `<md` · tablet
  `md–lg` · desktop `≥lg`) via `useLayoutBand`. Shipped: band-driven sidebar
  default (rail tablet / expanded desktop, re-snap on cross) + mobile drawer
  closes on nav; reusable `<ResponsiveList>` (shadcn Table `≥lg` / column-driven
  `Label: value` cards `<lg`) across the 4 admin lists; list pages wrapped in a
  `Card`; forms/wide responsive (TransferTable stacks `<lg` with ↑/↓; new-gym
  lat/lng; auth padding); profile-detail two-card layout; gyms search aligned to
  the card grid; shared `<Pager>` (gyms full + users) with mobile-wide buttons;
  `GET /users` now returns `{ users, total }` (api) for the users pager; uniform
  admin action-button sizing. **Full-screen dialogs on phones were tried and
  reverted** (looked off) — dialogs stay centered. Design ref: memory
  `ref-backtoyou-design`. `PLAN.md` removed (plan complete).
- **Backlog:** empty.
- **Demo (mock + seed):** users `admin` / `manager` / `support` / `johndoe`,
  senha `Password1!`. Mock seed has 24 gyms (2 inactive) to show pagination.

## Working rules (pointer + guardrails)

Full doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + the app's own
[`api/CLAUDE.md`](./api/CLAUDE.md) / [`web/CLAUDE.md`](./web/CLAUDE.md). Inlined
safety belt (do not violate):

- **Never `git push`** — only the user pushes.
- **Never commit without the gate green**; commit per phase, stage narrowly.
- Before each commit: `lint:fix` **and** `format` on the touched app.
- **One branch per group off `master`** (`--no-ff` merge); docs-only may go
  straight to `master`.
- **STOP at each group's end** for the user's browser test + merge authorization.
- Confirm before anything irreversible; reply pt-BR; UI text in code = English.

## Deeper memory

Claude harness memory (same machine only):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (esp. `backlog-plan-package` for the full delivered package +
remaining backlog, `project-state`, `feedback-run-format-before-commit`,
`tutorials-frozen-narrative`, `autonomous-phase-execution`). A cache — this file
is the source of truth for state.
