# monorepo_sample

Um **monorepo modelo**: backend Fastify/Prisma e frontend React/Vite num único
workspace pnpm, compartilhando **um contrato Zod** pras formas de
request/response e tipos. Feito pra ser copiado em projetos reais — a estrutura e
os padrões são o entregável. _(EN: [README.md](./README.md).)_

## O que tem dentro

| Caminho | O quê |
|---------|-------|
| [`api/`](./api/README-pt-BR.md) | Backend — **Fastify + Prisma + MySQL** (`solid_api_sample`), auth JWT + RBAC, `:3333`. |
| [`web/`](./web/README-pt-BR.md) | Frontend — **React 19 + Vite + Tailwind v4 + shadcn + MSW**, mock-first, cliente do `api/`. |
| [`packages/contracts/`](./packages/contracts/README-pt-BR.md) | `@root/contracts` — **schemas Zod + tipos** compartilhados ("Zod único"). |

Arquitetura: [PROJECT-pt-BR.md](./PROJECT-pt-BR.md). Acordo de trabalho pra
humanos + IA: [CLAUDE.md](./CLAUDE.md) / [AGENTS.md](./AGENTS.md) (e os de cada
app).

**Vai adicionar uma feature?** Guia passo-a-passo, front-first, pra adicionar uma
feature full-stack nova sem esquecer etapa (testes, mocks, i18n,
menu/permissões, contrato, docs): [`how-to/`](./how-to/README-pt-BR.md).

## Início rápido

Pré-requisitos: Node, **pnpm**, Docker (pro MySQL do backend). O `.env` de cada
app é gitignored — copie dos `.env.example` antes de rodar.

```sh
# 1. Instala o workspace inteiro (um comando, na raiz)
pnpm install

# 2. Só frontend — mock-first, sem backend
pnpm -C web dev:test            # http://localhost:5001  (mock MSW)

# 3. Stack completa — backend + frontend
pnpm -C api db:fresh            # MySQL up (Docker) + migrate + seed admin
pnpm -C api dev                 # backend            :3333
pnpm -C web dev                 # frontend, API real :3001
```

Admin semeado padrão (veja `api/.env`): `admin@example.com` / `Admin@12345`.
No modo mock, qualquer identifier + senha `Password1!` loga (`admin` → telas de
admin).

## Como funciona (versão curta)

- **Um workspace pnpm.** `pnpm install` na raiz instala `api`, `web` e
  `packages/*` num `node_modules` único com um lockfile. Scripts por app rodam
  como antes (`cd api && pnpm dev`, ou `pnpm -C web test:run`).
- **Um contrato compartilhado.** `@root/contracts` guarda a **forma do fio**
  (`snake_case`) como schemas Zod + tipos `z.infer`. O backend faz parse de
  request com ele, os forms do frontend derivam dele, e os mocks MSW validam
  contra ele — então os três não divergem. Refinamentos de UI ficam locais.
- **Frontend mock-first.** `web/` é desenvolvido e testado contra espelhos MSW da
  API; o backend real é ligado por último.
- **Controle de acesso (RBAC).** Um modelo híbrido de role + perfis dinâmicos
  atravessa os dois apps: o backend resolve as permissões efetivas por tela, e o
  frontend governa nav, rotas e botões a partir delas. Detalhe em
  [`api/PROJECT-pt-BR.md`](./api/PROJECT-pt-BR.md) e
  [`web/PROJECT-pt-BR.md`](./web/PROJECT-pt-BR.md) (setup nos `README*` dos apps).

Setup, rotas, tabelas de env e smoke de cada app estão nos `README*`/`PROJECT*`
deles.

## Gates

Rode no app que você tocou antes de commitar:

```sh
pnpm -C api  lint && pnpm -C api  compile  && pnpm -C api  test      # + test:e2e
pnpm -C web  lint && pnpm -C web  build    && pnpm -C web  test:run  # + test:e2e
pnpm -C packages/contracts typecheck
```
