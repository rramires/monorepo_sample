# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova)

> Leia `PLAN.md` + `CLAUDE.md` na raiz do repo e **comece pela Fase 0** do PLAN.md.
> Repo-modelo `monorepo_sample`: `api/` (Fastify+Prisma+MySQL) + `web/`
> (React+Vite+MSW) + `packages/contracts/` (`@root/contracts`, Zod compartilhado),
> um workspace pnpm — `pnpm install` na raiz; rode scripts por app (`pnpm -C api …`
> / `pnpm -C web …`).
>
> **Trabalho em andamento:** feature **access-control** (RBAC estilo "AppBase":
> `Role {ADMIN,USER}` com ADMIN bypass; acesso via Perfis→Telas com ações
> view/create/edit/delete; component `TransferTable` reutilizável). Desenho completo
> + dataset de seed + superfície de API + fases estão no **`PLAN.md`** (gitignored,
> só nesta máquina). Build **frontend-first** (web + MSW primeiro, backend por
> último). Fases: **0** contracts + rename `Role MEMBER→USER` (atômico
> contracts+api+web) · **1** mocks MSW + store semeado · **2** context `can()` +
> menu + guard de rota (🚦 visual) · **3** `TransferTable` com DnD (🚦) · **4** 4
> telas admin (🚦 visual) · **5** backend (Prisma+migration+seed+`requireScreen`) ·
> **6** liga web na API real + docs EN+PT (🚦 final).
>
> Doutrina: gate verde no app tocado antes de cada commit; branch local a partir de
> `master`; **NUNCA `git push`** (o usuário pusha); confirme antes de qualquer coisa
> irreversível; **responda sempre em pt-BR**. `PLAN.md` é apagado quando tudo verde.

## Current state

- **Branch:** `master` · **commit:** `d89df84` (2026-06-22).
- **Working tree:** `.gitignore` modificado (entrada `PLAN.md`) — **mudança local
  intencional, não commitar**; some junto com o PLAN.md no fim. `PLAN.md` presente
  (gitignored).
- **In-flight:** feature **access-control** — design 100% fechado e aprovado pelo
  usuário, registrado em `PLAN.md`. Checkpoint feito **antes** de executar. Próximo
  passo: **Fase 0** (criar branch local, fazer o rename + schemas, gate verde).
- **Core delivery anterior (merged + pushed):** workspace pnpm único, `@root/contracts`
  adotado backend→frontend→MSW, docs híbridas EN+PT, CI no root. Veja `PROJECT.md`.
- **Loose end (do usuário — nunca push eu):** apagar a branch remota
  `origin/ci/monorepo-workflows` → `git push origin --delete ci/monorepo-workflows`.

## Working rules

Doutrina completa em [`CLAUDE.md`](./CLAUDE.md) (+ `api/CLAUDE.md`, `web/CLAUDE.md`).
Guardrails irreversíveis (cinto de segurança):

- **Nunca `git push`** — o usuário pusha.
- **Nunca commitar sem aprovação**; branch a partir de `master` (docs-only pode ir
  direto em `master`).
- **Gate verde antes de todo commit** (lint + compile/build + test no app tocado;
  `packages/contracts` typecheck).
- **Confirmar antes de qualquer coisa irreversível** (delete/move/overwrite) — listar primeiro.
- **Responder sempre em pt-BR.**

## Deeper memory

Harness memory (Claude / mesma máquina):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — veja
`MEMORY.md` (preferência de execução por fases, pt-BR, project-state).
