# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> **Sessão de EXECUÇÃO** — refatorar o RBAC do `monorepo_sample` para permissões
> **finas (N operações por tela)**. Lê `CLAUDE.md` (root + `api/` + `web/`) e a
> memória `refactor-rbac-fine-grained-ops`. O **plano detalhado está em `PLAN.md`**
> (gitignored, na raiz — mesma máquina). Brainstorm **já feito**; decisões travadas.
>
> Resumo das decisões (detalhe + fases no `PLAN.md`): `permissions.action` vira
> **chave-string livre** (`UNIQUE(screen_id, action)`; enum → `String
> @db.VarChar(191)`, dropa o enum). Chave composta **`family_name`** com família ∈
> `{view,create,edit,delete}` (bare = só a família); `actionFamily()` faz split no
> 1º `_`. Key `^[a-z][a-z_]*$` max 40 (Name UI min 2/max 32); Label
> `^[A-Za-z][A-Za-z0-9 -]*$` trim min 3 max 40. Payload efetivo vira
> `screenPermissionSchema = { screen_key, actions: string[] }` (`can()=includes`,
> admin bypass). Editor: Operation Select `view·create·edit·delete·Other…`; **Other**
> abre Family Select (as 4) + Name + preview da chave. **Gym end-state (sem telas-
> fantasma):** `gym.dashboard`(view); `gym.gyms`(view,create,edit,**create_checkin**);
> `gym.check-ins`(view,**edit_validate**); **remove** `gym.history`+`gym.validations`;
> **renomeia** `gym.check-in`→`gym.check-ins`. Mata o cross-screen: Check-in gateia
> por `can('gym.gyms','create_checkin')`, Validate por
> `can('gym.check-ins','edit_validate')`.
>
> **Ordem:** G0 contracts → web+MSW (frontend-first) → API espelha verbatim → docs
> EN+PT. **Gate verde + commit por fase** (tabela no `PLAN.md`). Branch local off
> `master`; **NÃO pushar** (só o usuário). STOP no Final pro teste no browser +
> merge `--no-ff`. UI em inglês; `web/docs/TUTORIAL_*` **congelado**.

## Current state

- **Branch:** `master` — clean. Stamp: `a31adea 2026-06-25` (RBAC checkpoint),
  já pushado (origin sincronizado).
- **RBAC permissions redesign — DONE + merged + pushed.** Coarse model em produção.
- **▶ NEXT (execução): RBAC fine-grained refactor.** Brainstorm **concluído**
  (2026-06-25) — decisões travadas, plano completo em **`PLAN.md`** (gitignored).
  Próxima sessão: branch off `master` e executar G0→G8 do `PLAN.md`. Resumo das
  decisões na memória `refactor-rbac-fine-grained-ops` (seção "DECIDED").
- **Backlog (deferred, separate fixes):**
  - **`RequireScreen` `isFetching`:** stale `can()` flash on background refetch
    (mock-only).
  - **Auth boot refresh × StrictMode:** boot `refresh()` fires 2× in dev →
    single-use rotation 401s → intermittent F5 logout (prod-safe; own branch).
  - (Cross-screen button-gating já entra no `PLAN.md`, fase G3.)

## Working rules (pointer + guardrails)

Full doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + [`api/CLAUDE.md`](./api/CLAUDE.md)
/ [`web/CLAUDE.md`](./web/CLAUDE.md). Inlined safety belt (do not violate):

- **Never `git push`** — only the user pushes.
- **Never commit without the gate green**; commit per phase, stage narrowly.
- Before each web commit: `pnpm -C web lint:fix` **and** `format`.
- **One branch per group off `master`** (`--no-ff` merge); docs-only may go
  straight to `master`. **`PLAN.md` is gitignored — never commit it.**
- **STOP at the end** for the user's browser test + merge authorization.
- Confirm before anything irreversible; reply pt-BR; UI text in code = English.

## Deeper memory

Claude harness memory (same machine only):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (esp. `refactor-rbac-fine-grained-ops`, `rbac-permissions-redesign`,
`project-state`, the two `backlog-*` web fixes, `autonomous-phase-execution`,
`tutorials-frozen-narrative`). A cache — this file is the source of truth for state.
