# HOW-TO — Adicionar uma feature nova (full-stack, front-first)

Guia passo-a-passo para **adicionar qualquer coisa nova** a este monorepo sem
esquecer etapas (testes, mocks, i18n, menu/permissões, contrato, docs). Serve
tanto para **humano** quanto para **IA** que **não conhece o projeto** — mesmo já
existindo `README` / `PROJECT` / `CLAUDE` em cada app. O objetivo é guiar pelo
**fluxo de trabalho correto**, respeitando todos os padrões e divisões de
responsabilidade da casa, para não construir nada fora do padrão.

> **Leitura mínima antes de começar:** este README (orquestra tudo), depois
> [`01-frontend-pt-BR.md`](./01-frontend-pt-BR.md) e
> [`02-backend-pt-BR.md`](./02-backend-pt-BR.md) na ordem. Se você só vai mexer no
> front, o guia 01 já entrega uma tela funcional em modo mock.

---

## Para quem é

- **Humano novo no projeto** — siga os comandos copiáveis na ordem; cada passo diz
  o *porquê* e tem uma *validação* que prova que funcionou.
- **IA / agente** — trate cada fase como uma tarefa atômica: implemente, rode a
  validação, **commite**, siga. Não pule fases; não invente padrões.

## A filosofia da casa (entenda antes de digitar)

1. **Front-first, mock-first.** Você constrói a tela inteira contra um **mock MSW**
   e só depois fecha o backend. A tela tem que funcionar de ponta a ponta em
   `pnpm -C web dev:test` (modo mock, porta 5001) **antes** de existir API real.
2. **Contract-first.** O formato do "fio" (request/response, em `snake_case`) e os
   enums compartilhados moram em [`@root/contracts`](../packages/contracts/) — uma
   única fonte de verdade que front e back importam. O front mapeia `snake_case` →
   `camelCase` dentro de `src/api` e **nunca deixa o wire vazar** para o resto do app.
3. **Presentation Model (PM).** Todo componente com lógica é um **par**: `x.tsx`
   (view pura, só JSX) + `use-x-pm.ts` (estado/dados/formatação). A view **nunca**
   chama Axios; o PM **nunca** monta JSX.
4. **Server state = TanStack Query.** `useQuery`/`useMutation` + `invalidateQueries`,
   nunca `fetch` dentro de `useEffect` para dados de servidor.
5. **RBAC dinâmico.** O menu lateral e o acesso às rotas vêm das **permissões do
   usuário** (`/me/permissions`). Uma tela só vira link quando (a) está semeada e
   concedida a um perfil **e** (b) está registrada no `NAV_ENTRIES` do front.
6. **i18n total.** Nenhum texto literal em JSX — tudo via `t()` em `en` + `pt-BR`.
   As chaves são **tipadas**: chave faltando = erro de build.
7. **Texto de UI em inglês; prosa de tutorial em pt-BR.** (Estes guias são pt-BR;
   labels/toasts no código são inglês.)

## A feature-exemplo: "Notices" (mural de avisos)

Os guias constroem, do zero, um **módulo novo `Notices`** — uma tela CRUD numa
página só (tabela + diálogo de criar/editar + confirmar exclusão), com **dois
campos**:

| Campo | Tipo | Por que está aqui (a lição) |
|-------|------|------------------------------|
| `title` | input de texto | input básico + validação Zod localizada |
| `category` | **Select (Radix) controlado**, enum compartilhado no contracts | **cold-load** de campo controlado na edição (a lição-âncora do smoke) + enum único + i18n de opções |

Entidade: `Notice { id, title, category('info'|'warning'|'urgent'), created_at }`.
Dois campos cobrem quase tudo que uma feature real precisa, sem exagero.

> Onde olhar referências vivas (já no `master`): a tela **Gyms**
> ([`web/src/pages/app/gyms`](../web/src/pages/app/gyms/)) é o modelo de
> lista/form; o CRUD de **Modules**
> ([`web/src/pages/app/admin/modules`](../web/src/pages/app/admin/modules/)) é o
> modelo de página única com diálogo. No backend, **Modules**
> ([`api/src/http/controllers/modules`](../api/src/http/controllers/modules/)) é o
> CRUD análogo.

---

## Os dois guias (ordem)

1. **[`01-frontend-pt-BR.md`](./01-frontend-pt-BR.md) — front, mock-first.**
   Contrato compartilhado → cliente de API + mock MSW → fiação de menu/permissão →
   i18n → página + PM + diálogo → testes (unit + e2e) → smoke no browser. Ao final,
   a tela funciona inteira em modo mock.
2. **[`02-backend-pt-BR.md`](./02-backend-pt-BR.md) — back, fecha o contrato.**
   Migração Prisma → repositório → use-case → controllers/rotas → testes → seed →
   trocar o mock pela **API real** e revalidar a mesma tela.

---

## Workflow de git (isto também é a aula)

Trabalhe como o projeto trabalha — assim o guia já ensina a disciplina ao próximo
dev/IA:

1. **Branch por parte maior**, a partir do `master`. Ex.: `feat/notices-frontend`,
   depois `feat/notices-backend`. **Nunca** commite código direto no `master`.
2. **Commit por fase.** Cada fase coerente vira um commit, criado **logo após sua
   validação passar**. Stage estreito (`git add <caminhos>`). Conventional Commits.
   Nunca deixe uma fase pronta sem commit; nunca misture trabalhos diferentes.
3. **Validação verde antes de todo commit** (tabela abaixo).
4. **Ao terminar a parte, PARE para o usuário.** Ele testa no browser (mudanças de
   rota/form) e **autoriza o merge**; só então faça o merge local
   (`git checkout master && git merge --no-ff <branch>`).
5. **Só o usuário dá push.** **Nunca** rode `git push`. Depois do push, apague a
   branch local.

Mensagem de commit termina com:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Validações (rode da raiz do monorepo)

| App | Validação (antes de cada commit) |
|-----|------------------------------|
| `contracts` | `pnpm -C packages/contracts typecheck` |
| `web` | `pnpm -C web lint && pnpm -C web build && pnpm -C web test:run` — e `pnpm -C web test:e2e` quando tocar rota/fluxo |
| `api` | `pnpm -C api lint && pnpm -C api compile && pnpm -C api test` — e `pnpm -C api test:e2e` (MySQL up: `pnpm -C api compose:up`) quando tocar rota/seed |

> ⚠️ **Antes de validar, rode o autofix de lint** — o `simple-import-sort` ordena
> imports **só no `--fix`**; o `lint` puro **falha** ("Run autofix to sort these
> imports!") se um import novo ficar fora de ordem:
>
> ```sh
> pnpm -C web lint:fix     # ou pnpm -C api lint:fix
> ```
>
> (Se o seu editor já roda ESLint autofix ao salvar, isso acontece sozinho.)

> Dica de formatação: rode o Prettier **só nos arquivos que você tocou**
> (`pnpm -C web exec prettier --write <caminhos>`), nunca na árvore inteira — senão
> você varre arquivos pré-existentes não-formatados para dentro do seu commit.

---

## Checklist transversal "não esquecer"

Cite/confira em cada ponto relevante. Os guias repetem isto inline onde importa.

- **Fidelidade do mock.** Todo `web/src/api/*.ts` tem um
  `web/src/api/mocks/*-mock.ts` espelhando o backend **verbatim** (status, envelope
  de erro `{ code, message, meta? }`, paginação). Ajuste os dois juntos. Cuide a
  **ordem dos handlers** em `mocks/index.ts`: rotas **estáticas antes** das `:param`.
- **Campos controlados (cold-load).** Em `Select`/`Switch`/OTP (Radix), valide o
  **valor semeado** na edição, não só a presença — re-semeie no `onOpenChange` do
  diálogo. happy-dom e o auto-wait do Playwright **escondem** esse bug; o **smoke
  manual no browser** pega.
- **Env.** Todo `VITE_*` novo entra no `web/.env.example` (comentado) **e** no
  schema Zod em `web/src/env.ts`. Todo env novo do back entra no `api/.env.example`
  **e** no schema em `api/src/env/index.ts`. `VITE_*` é **público** (vai pro bundle)
  — **nunca** segredo.
- **Arquitetura.** View não chama Axios; PM não monta JSX; `snake_case` não vaza de
  `src/api` (mapear para `camelCase` lá); server state via TanStack Query.
  No back: controller não fala com Prisma; use-case não fala com HTTP; dependência
  entra por **interface** via **factory**.
- **Contracts / Zod único.** Enums (categorias, roles, status) e shapes do fio no
  pacote compartilhado; o front mapeia **código → texto**. Erros do back chegam como
  `code` estável e são traduzidos por `messageFromError` no front.
- **Docs nos 2 idiomas.** Toda mudança de doc cai em `README.md` + `README-pt-BR.md`
  e `PROJECT.md` + `PROJECT-pt-BR.md` coerentes (tabela de rotas, env, árvore,
  features). Os `web/docs/TUTORIAL_*` são narrativa de build **congelada** — não
  edite.
- **Texto de UI em inglês; prosa em pt-BR.**
- **Commits:** Conventional Commits, um por fase, validação verde antes; **nunca push**
  (só o usuário). Respeite o `CLAUDE.md`/`AGENTS.md` de cada app.

---

## Como usar este guia (resumo de uma linha)

Leia este README → siga o **01-frontend** até a tela rodar em mock → siga o
**02-backend** até trocar pelo real → revise as docs nos 2 idiomas → **pare e
deixe o usuário testar e dar merge/push.**
