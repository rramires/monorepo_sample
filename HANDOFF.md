# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova, após compactar)

> Sessão de **discussão/brainstorm** — **não executar código ainda**. Lê
> `HANDOFF.md` + `CLAUDE.md` do monorepo `monorepo_sample` (+ a memória
> `refactor-rbac-fine-grained-ops`, mesma máquina). **Tema: refatorar o RBAC para
> permissões FINAS (N operações por tela).**
>
> Hoje é **coarse**: `permission = (screen, action enum view|create|edit|delete,
> label amigável)`, com **UNIQUE(screen_id, action)** → no máx. 1 create/edit/
> delete por tela → operações extras viram **telas próprias** (o check-in é a tela
> `gym.check-in`) → **ações cross-screen** (o botão "Check in" fica no `/gyms` mas a
> permissão é `gym.check-in.create`). Isso confundiu no teste.
>
> Duas abordagens a decidir: **(A)** do usuário — `action` ganha **"other"** + um
> **3º campo `unique_id`** (antes do Label), obrigatório quando `other`. **(B)**
> recomendada — `action` vira **chave-string livre** com `UNIQUE(screen_id,
> action)`: as 4 CRUD viram chaves convencionais, ops extras são só mais chaves
> (`import`, `export`…), **sem `unique_id` nem constraint condicional** (constraint
> condicional **não é cross-DB** no Prisma: MySQL não tem índice parcial; CHECK não
> é modelado/uniforme).
>
> Escopo provável: contracts (enum→string), api (`Permission.action` String +
> migration, `requireScreen`/`can` com chaves arbitrárias, validação no editor,
> seed), web (`ScreenAction`→string, editor "Other"/chave-livre, `can()`), **+ fix
> cross-screen**: gatear o botão Check-in do gym-card por `can('gym.check-in',
> 'create')` (hoje **sempre renderiza** — ignora o grant), docs EN+PT.
>
> **Brainstorm primeiro** (1 pergunta por vez, pt-BR), depois escreve `PLAN.md`
> (gitignored) e executa numa sessão de execução. Branch local off `master`;
> **NÃO pushar** (só o usuário). UI em inglês; `web/docs/TUTORIAL_*` congelado.

## Current state

- **Branch:** `master` — clean. Stamp: `931431c 2026-06-25` (Merge
  `feat/rbac-permissions`).
- **RBAC permissions redesign — DONE + merged (`--no-ff`), PUSH PENDING.** The
  user pushes `master` (origin/master is behind by the 9 feature commits + the
  merge). After the push: delete the local branch (`git branch -d
  feat/rbac-permissions`). The old `PLAN.md` was removed (plan complete +
  verified). Gist of what shipped:
  - New `permissions` catalog (`screen_id`, `action` enum, friendly `label`,
    `is_system`, UNIQUE(screen_id, action)) + `profile_permissions` grant join;
    `profile_screens` → **membership**; `Profile.default_screen_id` landing;
    `is_active` (module/screen/profile) + `is_enabled` (screen kill switch).
  - **3 axes** (admin bypasses): grant · kill `is_enabled` ("This screen is
    temporarily unavailable.") · disable `is_active`. **No-cascade deletes** →
    409 in use (FKs Restrict). `view` is an explicit grant. Two Forbidden
    messages (no-view vs killed). Built frontend-first (MSW); API mirrors verbatim.
  - **Verified:** all gates green (web lint/build/test:run + e2e; api lint/compile/
    test + e2e; contracts typecheck) **and** a 10/10 manual browser battery
    (single-user + concurrent two-browser).
- **▶ NEXT (own session): RBAC fine-grained refactor discussion** — see the resume
  prompt above + memory `refactor-rbac-fine-grained-ops`. Brainstorm → PLAN → execute.
- **Backlog (deferred, separate fixes):**
  - **Cross-screen button-gating:** gym-card "Check in" button ignores
    `can('gym.check-in','create')` (always renders). Fold into the refactor.
  - **`RequireScreen` `isFetching`:** stale `can()` flash on background refetch
    (mock-only; backend re-checks per request).
  - **Auth boot refresh × StrictMode:** boot `refresh()` fires 2× in dev →
    single-use rotation 401s → intermittent F5 logout (prod-safe; own branch).

## Working rules (pointer + guardrails)

Full doctrine: [`CLAUDE.md`](./CLAUDE.md) (root) + the app's own
[`api/CLAUDE.md`](./api/CLAUDE.md) / [`web/CLAUDE.md`](./web/CLAUDE.md). Inlined
safety belt (do not violate):

- **Never `git push`** — only the user pushes.
- **Never commit without the gate green**; commit per phase, stage narrowly.
- Before each web commit: `pnpm -C web lint:fix` **and** `format`.
- **One branch per group off `master`** (`--no-ff` merge); docs-only may go
  straight to `master`.
- **STOP at each group's end** for the user's browser test + merge authorization.
- Confirm before anything irreversible; reply pt-BR; UI text in code = English.

## Deeper memory

Claude harness memory (same machine only):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — see
`MEMORY.md` (esp. `refactor-rbac-fine-grained-ops`, `rbac-permissions-redesign`,
`project-state`, the two `backlog-*` web fixes, `autonomous-phase-execution`,
`tutorials-frozen-narrative`). A cache — this file is the source of truth for state.
