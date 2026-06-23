# HANDOFF — monorepo_sample (resume state)

Break-glass resume file (portable across models/tools). **State** lives here;
**doctrine** lives in [`CLAUDE.md`](./CLAUDE.md) (single source — this file points,
never copies). Architecture: [`PROJECT.md`](./PROJECT.md).

## Resume prompt (cole numa sessão nova)

> Leia `PLAN.md` + `CLAUDE.md` na raiz e continue a feature **access-control** na branch
> `feat/access-control`. Monorepo `monorepo_sample`: `api/` (Fastify+Prisma+MySQL) + `web/`
> (React+Vite+MSW) + `packages/contracts/` (Zod compartilhado), workspace pnpm — `pnpm install`
> na raiz; gates por app (`pnpm -C api …` / `pnpm -C web …`). Responda sempre em **pt-BR**.
>
> **Já feito (Fases 0–5, 7, 8 — commitado, tudo verde):** RBAC `Role{ADMIN,USER}` + Perfis→Telas
> (ações view/create/edit/delete), `TransferTable` com DnD, 4 telas admin (modules/screens/
> profiles/users), `can()`+nav data-driven+`RequireScreen`, backend (models + migration +
> `requireScreen` + CRUD + seed espelhando o dataset), **desativar usuário** (`is_active`:
> bloqueia login + corta no próximo request via verifyJwt) e **tela default ao logar**
> (default por-perfil = flag `is_default` no grant + override por-usuário `User.default_screen_key`;
> resolução: override→default-de-perfil(menor ordem módulo,tela)→primeira permitida→/account,
> exposto em `GET /me/permissions.default_screen_key`).
>
> **FALTA — Fase 6 (final 🚦):**
> 1. **Fix de catálogo do nav (FAZER PRIMEIRO):** o menu é data-driven via `GET /modules`+
>    `/screens`, mas no backend essas rotas são gated (admin) → um não-admin NÃO monta o nav na
>    API real. Enriquecer `GET /me/permissions` pra já trazer o catálogo do menu (por tela que o
>    user vê: key, name, path, module key/name + ordens) e fazer o sidebar/LandingRoute
>    consumirem isso em vez de `/modules`+`/screens`. Ajustar contracts + mock + resolver.
> 2. **Ligar web→API real:** `api` com DB seedado (`pnpm -C api db:fresh`) + `pnpm -C web dev`
>    (modo real, sem MSW). Walkthrough DB-limpa de cada rota nova (status codes).
> 3. **Docs EN+PT** (root + api + web: README/PROJECT × 2 idiomas): tabelas de rotas/env,
>    models, árvore de pastas, nota "out of scope / cloner adiciona multi-tenant".
> 4. **🚦 final:** usuário testa no browser, autoriza o merge (`git checkout master && git merge`),
>    **usuário** dá push e apaga a branch. **Apagar `PLAN.md`** + a entrada `PLAN.md` no `.gitignore`.
>
> **Deferido (features/refactor futuro, NÃO nesta branch):** admin criar usuário (hoje só edita
> auto-cadastrados) + atalho "conceder todas as telas do módulo X"; perfil é bundle global
> cross-module de propósito (não por-módulo como o AppBase antigo). Loose end: apagar branch remota
> `origin/ci/monorepo-workflows` (só o usuário pusha).
>
> Doutrina: gate verde no app tocado antes de cada commit; commit por fase; **NUNCA `git push`**;
> confirme antes de irreversível; `PLAN.md` nunca commitado.

## Current state

- **Branch:** `feat/access-control` · **commit:** `0f9e1da` (2026-06-23). NÃO mergeada.
- **Working tree:** só `.gitignore` modificado (entrada `PLAN.md`) — **mudança local intencional,
  não commitar**; some junto com o `PLAN.md` no fim. `PLAN.md` presente (gitignored) com as fases
  (Fase 7/8 já feitas; Fase 6 pendente).
- **Done (commitado, verde):** Fases 0–5 (`f7742dc`→`5349f6f`), 7 `is_active` (`47fb75f`),
  8 tela-default (`0f9e1da`). Gates: web unit 24 / e2e 24 · api unit 98 / e2e 67 · contracts ok.
- **MySQL:** container subiu nesta sessão; migrations aplicadas (`add_access_control`,
  `add_user_is_active`, `add_default_landing_screen`). Pro walkthrough use `pnpm -C api db:fresh`.
- **Next:** Fase 6 — começar pelo **fix de catálogo do nav** (item 1 acima).
- **Demo (mock + seed):** users `admin` / `manager` / `support` / `johndoe`, senha `Password1!`.

## Working rules

Doutrina completa em [`CLAUDE.md`](./CLAUDE.md) (+ `api/CLAUDE.md`, `web/CLAUDE.md`).
Guardrails irreversíveis (cinto de segurança):

- **Nunca `git push`** — o usuário pusha.
- **Nunca commitar sem aprovação**; branch a partir de `master`.
- **Gate verde antes de todo commit** (lint + compile/build + test no app tocado; e2e em
  rotas/flows; `packages/contracts` typecheck).
- **Confirmar antes de qualquer coisa irreversível** (delete/move/overwrite) — listar primeiro.
- **Responder sempre em pt-BR.**

## Deeper memory

Harness memory (Claude / mesma máquina):
`~/.claude/projects/-home-user--Dev-samples-monorepo-sample/memory/` — veja `MEMORY.md`.
