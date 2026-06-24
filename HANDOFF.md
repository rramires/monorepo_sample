# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Leia `PLAN.md` + `HANDOFF.md` + `CLAUDE.md` na raiz do monorepo `monorepo_sample`
> e **execute o pacote de follow-ups do access-control**, começando pela **G0**.
> Monorepo: `api/` (Fastify+Prisma+MySQL) + `web/` (React+Vite+MSW) +
> `packages/contracts/` (`@root/contracts`, Zod). `PLAN.md` (na raiz, gitignored
> localmente) tem o detalhe de cada grupo — fases, gates, docs, verificação.
>
> Ordem: **G0** chore nomes e2e do web (`e2e`→`test:e2e`, `e2e:ui`→`test:e2e:ui`,
> **e `pree2e`→`pretest:e2e`** senão o hook morre; + CI `web.yml` + docs) → **G1**
> `is_system` em Module+Screen (anti-lockout; erros→409; só Access Control vira
> system, gym fica deletável) → **G2** padrão de desativação (toggle Active no form
> + confirm no save quando desativar, reusa `confirm-dialog.tsx`; retrofit no
> user-edit que hoje salva silencioso) → **G3** gym soft-delete (`Gym.is_active`;
> check-in em inativa →403; listas do membro só ativas; admin tem checkbox "Show
> deactivated"; toggle dentro do Edit gym usando o helper da G2) → **G4** breadcrumb
> no header (espaço morto do `app-layout`) + corrige ativo da sidebar em sub-rotas
> (hoje é igualdade exata) → **G5** grants: chips MultiSelect (Popover+Badge+`cmdk`)
> ACIMA da TransferTable (ela fica intocada) + coluna de módulo → **G6** docs:
> fechar o gráfico §4.1 do `api/PROJECT.md` (passos 10–13) + sweep final (EN+PT, só
> docs, direto no master).
>
> Doutrina: 1 branch local por grupo off `master`; **commit por fase** após gate
> verde; **antes de cada commit**: `pnpm -C <app> lint:fix && pnpm -C <app> format`
> (o format evita diff de autosave depois); gates — api `lint && compile && test`
> (+`test:e2e`, MySQL via `compose:up`), web `lint && build && test:run`
> (+`test:e2e`), contracts `typecheck`; docs EN+PT (4 arquivos por app). **PARE no
> fim de cada grupo** pro usuário testar no browser, autorizar o merge e **pushar
> (só o usuário pusha)**. Confirme antes de qualquer irreversível. Responda em
> pt-BR. Comece pela G0.

## Current state

- **Branch:** `master` — clean, pushed. Commit `71e5e55` (2026-06-23, merge of
  `feat/access-control`).
- **Access-control feature:** DONE, merged, pushed (phases 0–8: RBAC, admin
  screens, `/me/permissions` with menu catalog, deactivate user, default landing
  screen). Nothing in flight from it.
- **In flight:** nothing started yet. A **package of 7 follow-up groups (G0–G6)**
  is planned in `PLAN.md` (local, gitignored via `.git/info/exclude`). Awaiting
  the go to start **G0**.
- **Next step:** branch `chore/web-e2e-script-names` off `master`; do G0 per
  `PLAN.md`; gate; commit per phase; STOP for the user's merge.
- **Demo (mock + seed):** users `admin` / `manager` / `support` / `johndoe`,
  password `Password1!`.

## Working rules (pointer + guardrails)

Full doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + the app's own
[`api/CLAUDE.md`](./api/CLAUDE.md) / [`web/CLAUDE.md`](./web/CLAUDE.md). Inlined
safety belt (do not violate):

- **Never `git push`** — only the user pushes.
- **Never commit without the gate green**; commit per phase, stage narrowly.
- Before each commit: `lint:fix` **and** `format` on the touched app.
- **One branch per group off `master`**; never commit code to `master` (docs-only
  may go straight to `master`).
- **STOP at each group's end** for the user's browser test + merge authorization.
- Confirm before anything irreversible; reply pt-BR; UI text in code = English.

## Deeper memory

Claude harness memory (same machine only):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (esp. `backlog-plan-package` for the full package detail,
`feedback-run-format-before-commit`, `project-state`, `autonomous-phase-execution`).
A cache — `PLAN.md` + this file are the source of truth for state.
