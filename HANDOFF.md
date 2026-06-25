# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Leia `HANDOFF.md` + `CLAUDE.md` na raiz do monorepo `monorepo_sample` e continue
> a partir de _Current state_. **Tudo entregue e mergeado no `master`; nada em
> andamento, backlog vazio.** Monorepo: `api/` (Fastify+Prisma+MySQL) + `web/`
> (React+Vite+MSW) + `packages/contracts/` (`@root/contracts`, Zod).
>
> Doutrina (em `CLAUDE.md`, fonte única): 1 branch local por tarefa off `master`;
> **commit por fase** após gate verde; **antes de cada commit web**:
> `pnpm -C web lint:fix && pnpm -C web format`; gate web `lint && build &&
> test:run` (+`test:e2e` se mexer em fluxo), gate api `lint && compile && test`
> (+`test:e2e` com MySQL se mexer em rota); docs EN+PT (4 arquivos). **PARE** pro
> usuário testar no browser, autorizar o merge (`git merge --no-ff`) e **pushar
> (só o usuário pusha)**. Confirme antes de irreversível. Responda em pt-BR.
> `web/docs/TUTORIAL_*` é congelado — não mexer.

## Current state

- **Branch:** `master` — clean. Code through the responsive merge `08194b5` is
  **pushed**; the `docs(web)`/`docs(api)` commits after it (`3e0bca2`, `c7103c6`)
  and this HANDOFF edit are **local — the user pushes**. Last commit `c7103c6`,
  2026-06-25.
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
