# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Leia `PLAN.md` + `HANDOFF.md` + `CLAUDE.md` na raiz do monorepo `monorepo_sample`
> e **continue o pacote de follow-ups do access-control a partir da G5** (G0–G4 já
> estão prontas, mergeadas e **pushadas** no `master`). Monorepo: `api/`
> (Fastify+Prisma+MySQL) + `web/` (React+Vite+MSW) + `packages/contracts/`
> (`@root/contracts`, Zod). `PLAN.md` (na raiz, gitignored) tem o detalhe.
>
> Ordem restante: **G5** — grants module filter (web-only). Numa branch nova
> `feat/grants-module-filter` off `master`: (1) `chore(web)` adiciona `cmdk` (única
> dep nova) + um **MultiSelect enxuto próprio** (radix Popover já é dep + Badge já
> existe + Command/`cmdk`) → chips/badges com X; NÃO usar o pacote
> `shadcn-multi-select-component`. (2) `feat(web)` na página de grants
> (`profile-detail.tsx`): enriquecer as linhas de screen com `module_key`/
> `module_name`, adicionar o **filtro de módulo em chips ACIMA da TransferTable**
> (ela fica genérica/intocada; o Search dela continua só sobre as linhas já
> presentes) ligado ao lado Available, e uma **coluna de módulo nos DOIS lados**
> (Available + Granted — decidido). TransferTable é reusada por
> `user-profiles-card.tsx`, então NÃO alterá-la. (3) `docs(web)` README/PROJECT
> EN+PT. → **G6** docs-only direto no `master`: fechar o gráfico §4.1 do
> `api/PROJECT.md` (passos 10–13, ver `backlog-plan-package` item 2) + sweep final
> EN+PT.
>
> Doutrina: 1 branch local por grupo off `master`; **commit por fase** após gate
> verde; **antes de cada commit**: `pnpm -C <app> lint:fix && pnpm -C <app> format`;
> gates — web `lint && build && test:run` (+`test:e2e` p/ fluxos), contracts
> `typecheck` (api só se mexer em api); docs EN+PT (4 arquivos por app). **PARE no
> fim de cada grupo** pro usuário testar no browser, autorizar o merge
> (`git merge --no-ff`) e **pushar (só o usuário pusha)**. Confirme antes de
> qualquer irreversível. Responda em pt-BR.

## Current state

- **Branch:** `master` — clean, **em sync com `origin/master`** (commit `5eac7a0`,
  2026-06-24). Nada pendente de push.
- **Done + merged + pushed (this package):** **G0** (web e2e scripts → `test:e2e`),
  **G1** (`is_system` em Module+Screen: delete/rename-key → 409; screen trava
  module+path; campos read-only nos edit dialogs), **G2** (`useConfirmDeactivate` +
  `ConfirmDialog` controlado; retrofit user-edit), **G3** (gym soft-delete
  `Gym.is_active`: check-in inativa → 403; membro vê só ativas; gerente lista
  completa não-geo + toggles Nearby/Show-deactivated + paginador page-size 8),
  **G4** (breadcrumb no header `components/breadcrumb/` — trilha estática + folha
  dinâmica via `useSetBreadcrumb`, crumb-solo cinza; sidebar ativo por segmento
  `isItemActive`; **`PageHeader`** reusável `text-xl` adotado em todas as páginas).
- **In flight:** nada. Próximo = **G5** (branch `feat/grants-module-filter`).
- **Next step:** branch off `master` → G5 fase 1 (`cmdk` + MultiSelect).
- **Backlog (anotado):** sign-in keyboard UX; invariante "exatamente 1 profile
  `is_default`" (ver `backlog-plan-package` item 8). PLAN.md tem G5–G6 detalhados.
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
`MEMORY.md` (esp. `backlog-plan-package` for full package detail + remaining G5–G6,
`project-state`, `feedback-run-format-before-commit`, `tutorials-frozen-narrative`,
`autonomous-phase-execution`). A cache — `PLAN.md` + this file are source of truth
for state.
