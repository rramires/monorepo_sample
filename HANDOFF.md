# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Leia `PLAN.md` + `HANDOFF.md` + `CLAUDE.md` na raiz do monorepo `monorepo_sample`
> e **continue o pacote de follow-ups do access-control a partir da G4** (G0–G3 já
> estão prontas, mergeadas no `master`). Monorepo: `api/` (Fastify+Prisma+MySQL) +
> `web/` (React+Vite+MSW) + `packages/contracts/` (`@root/contracts`, Zod). `PLAN.md`
> (na raiz, gitignored localmente) tem o detalhe de cada grupo.
>
> **Antes de começar:** confirme com o usuário que ele **já fez `git push` do
> master** e delete a branch local `feat/gym-deactivation` (`git branch -d`).
>
> Ordem restante: **G4** breadcrumb no header (espaço morto do `app-layout`, flex-1)
> via context+hook `useBreadcrumb`, e **corrige o ativo da sidebar em sub-rotas**
> (`app-sidebar.tsx:46` usa igualdade exata `pathname === to`; trocar por match
> aninhado/segment-aware, cuidando do `/` Dashboard não casar com tudo) → **G5**
> grants: filtro de módulo em **chips MultiSelect** (radix Popover + Badge + `cmdk`
> — só `cmdk` é dep nova) **ACIMA da TransferTable** (ela fica genérica/intocada;
> o Search dela continua só sobre as linhas) + **coluna de módulo** nas linhas
> (enriquecer com `module_key`/`module_name` em `profile-detail.tsx`); web-only →
> **G6** docs-only direto no `master`: fechar o gráfico §4.1 do `api/PROJECT.md`
> (passos 10–13, ver `backlog-plan-package` item 2) + sweep final EN+PT.
>
> Doutrina: 1 branch local por grupo off `master`; **commit por fase** após gate
> verde; **antes de cada commit**: `pnpm -C <app> lint:fix && pnpm -C <app> format`;
> gates — api `lint && compile && test` (+`test:e2e`, MySQL via `compose:up`), web
> `lint && build && test:run` (+`test:e2e`), contracts `typecheck`; docs EN+PT (4
> arquivos por app). **PARE no fim de cada grupo** pro usuário testar, autorizar o
> merge (`git merge --no-ff`) e **pushar (só o usuário pusha)**. Confirme antes de
> qualquer irreversível. Responda em pt-BR. Comece confirmando o push da G3, depois
> a G4.

## Current state

- **Branch:** `master` — clean. Commit `0e8ea31` (2026-06-24, merge of
  `feat/gym-deactivation`). **master está ~11 commits À FRENTE de `origin/master`**
  — o usuário ainda precisa `git push`.
- **Done + merged (this package):** **G0** (web e2e scripts → `test:e2e`), **G1**
  (`is_system` em Module+Screen: delete/rename-key → 409; screen trava também
  module+path; campos read-only nos edit dialogs; só Access Control é system),
  **G2** (helper reusável `useConfirmDeactivate` + `ConfirmDialog` controlado;
  retrofit no user-edit), **G3** (gym soft-delete `Gym.is_active`: check-in em
  inativa → 403; membro vê só ativas; gerente tem **lista completa não-geo** +
  toggles **Nearby only**/**Show deactivated** + **paginador** page-size 8 com
  `total`; Active toggle no Edit gym via helper da G2).
- **In flight:** nada. Próximo = **G4** (depois do push da G3).
- **Pendências do usuário:** `git push` do master (G0–G3); depois
  `git branch -d feat/gym-deactivation`.
- **Next step:** confirmar push → branch `feat/nav-breadcrumb` off `master` → G4.
- **Backlog (anotado):** sign-in keyboard UX; invariante "exatamente 1 profile
  `is_default`" (ver `backlog-plan-package` item 8). PLAN.md tem G4–G6 detalhados.
- **Demo (mock + seed):** users `admin` / `manager` / `support` / `johndoe`,
  senha `Password1!`. Mock seed tem 24 gyms (2 inativas) p/ ver paginação.

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
`MEMORY.md` (esp. `backlog-plan-package` for full package detail + remaining G4–G6,
`project-state`, `feedback-run-format-before-commit`, `tutorials-frozen-narrative`,
`autonomous-phase-execution`). A cache — `PLAN.md` + this file are source of truth
for state.
