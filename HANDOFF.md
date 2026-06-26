# HANDOFF — monorepo_sample (resume state)

Break-glass resume file. **State** here; **doctrine** in [`CLAUDE.md`](./CLAUDE.md)
(root + `api/` + `web/`). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (paste into a fresh session)

> **Sessão de EXECUÇÃO — refactor PM audit (web).** Lê `web/CLAUDE.md` + a memória
> `backlog-pm-audit-tsx`. O plano completo está em **`PLAN.md`** (gitignored, na
> raiz — mesma máquina). Escopo **travado: A + B + D** (C fora — primitivos
> genéricos; F1 auth StrictMode vai em branch própria, NÃO aqui).
>
> **Régua (gold = `web/src/pages/app/account/email-card.tsx`):** corpo da view =
> só `const pm = useXxxPM()` + `return`. Nada entre os dois (sem useState, hook,
> derivado, handler). Senão, move pra `use-<name>-pm.ts` (par **flat**, mesma
> pasta). Comportamento idêntico; props só de display ficam no JSX.
>
> **Fases (gate `pnpm -C web lint && build && test:run`, +`test:e2e` em B; commit
> por arquivo):**
> - **A** (novo PM cada, exceto permissions-editor que dobra o `open` no PM
>   existente): `gym-card` · `permissions-editor` · `landing-card` ·
>   `module-dialog` · `profile-dialog` · `screen-dialog`.
> - **D** (PM já existe — mover o `useSetBreadcrumb(pm.…)` PRA DENTRO do PM):
>   `profile-detail` · `user-edit`.
> - **B** (novo PM cada; routing/layout): `require-screen` (+ **F2**: gatear
>   também em `isFetching`, não só `isLoading`) · `landing-route` ·
>   `protected-route` · `role-route` · `app-layout`. Roda `test:e2e`.
>
> Branch local off `master` (ex.: `refactor/web-pm-audit`). **NÃO pushar.** Pré-
> commit: `lint:fix` + `format`. STOP no Final pro teste no browser + merge
> `--no-ff`. Lista exata de violações + linhas no `PLAN.md`.

## Current state

- **Branch:** `master` — clean. `origin/master` synced.
- **RBAC fine-grained — DONE + merged + pushed** (merge `6d61a64`): free-key
  actions, `actions[]`, gym collapse, server-side enforcement on every route +
  security battery (155) + hardening tests. api e2e 238 · web e2e 11 green.
- **▶ NEXT: PM audit refactor (web)** — planned, NOT started (context ran low).
  Plan in `PLAN.md`; scope A+B+D locked. Execute in a fresh session.
- **Backlog (deferred, own branches):**
  - **F1 — auth boot refresh × StrictMode**: dev double-`refresh()` → single-use
    rotation 401 → intermittent F5 logout. Fix: boot uses single-flight
    `refreshAccessToken()`. (memory `backlog-auth-bootstrap-refresh-strictmode`)
  - **F2 — RequireScreen `isFetching`**: stale `can()` flash; folds into the
    require-screen PM work in phase B above.

## Working rules (pointer + guardrails)

Doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + [`web/CLAUDE.md`](./web/CLAUDE.md).
Safety belt: **never `git push`** (only the user) · never commit without the gate
green · commit per phase, stage narrowly · branch off `master`, `--no-ff` merge ·
**`PLAN.md` is gitignored — never commit it** · STOP at the end for the user's
browser test. Reply pt-BR; UI text in code = English; `web/docs/TUTORIAL_*` frozen.

## Deeper memory

`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (esp. `backlog-pm-audit-tsx`, the two `backlog-*` web fixes,
`refactor-rbac-fine-grained-ops`). A cache — this file is the source of truth.
