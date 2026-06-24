# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Leia `HANDOFF.md` + `CLAUDE.md` na raiz do monorepo `monorepo_sample` e continue
> a partir de _Current state_. O **pacote de follow-ups do access-control (G0–G6)
> está 100% concluído, mergeado e pushado** no `master` — nada em andamento.
> Monorepo: `api/` (Fastify+Prisma+MySQL) + `web/` (React+Vite+MSW) +
> `packages/contracts/` (`@root/contracts`, Zod).
>
> Não há trabalho ativo. Itens de **backlog** (NÃO começar sem o usuário fechar
> escopo): (1) invariante "exatamente 1 profile `is_default`" — bloquear desligar
> o último default / no máx. um (backend profiles use-case + web profile-detail);
> (2) sign-in keyboard UX (autofocus no 1º campo; o link Forgot rouba um tab).
>
> Doutrina: 1 branch local por grupo off `master`; **commit por fase** após gate
> verde; **antes de cada commit**: `pnpm -C <app> lint:fix && pnpm -C <app> format`;
> gates — web `lint && build && test:run` (+`test:e2e`), api `lint && compile &&
> test` (+`test:e2e`, MySQL via `compose:up`), contracts `typecheck`; docs EN+PT
> (4 arquivos por app). **PARE no fim de cada grupo** pro usuário testar, autorizar
> o merge (`git merge --no-ff`) e **pushar (só o usuário pusha)**. Confirme antes
> de qualquer irreversível. Responda em pt-BR.

## Current state

- **Branch:** `master` — clean. Last commit `99a12a6`
  (`docs(api): close §4.1 ... steps 10-13`), 2026-06-24. **If `master` is ahead of
  `origin`, the user still needs to push.**
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
- **In flight:** nothing.
- **Backlog (not started; don't begin without the user closing scope):** exactly-
  one-`is_default`-profile invariant; sign-in keyboard UX. `PLAN.md` (local,
  gitignored) is now stale — may be `rm`-ed.
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
