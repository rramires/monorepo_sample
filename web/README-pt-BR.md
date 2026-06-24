# web — Frontend estilo GymPass

Aplicação single-page em React + TypeScript para o domínio estilo GymPass
(academias, check-ins, conta e admin). É o **cliente** da API
[`solid_api_sample`](../api) (Fastify/Prisma), construído
**mock-first**: cada tela é entregue contra um mock MSW que espelha o contrato
real da API, então a UI fica pronta e testada antes do backend ser ligado.

> 🇺🇸 English version: [README.md](README.md)

## Arquitetura

Para a referência completa de arquitetura (estrutura de pastas, os padrões
Presentation Model e Context, mobile-first, o método mock-first, fluxo de dados,
auth/RBAC, formulários, testes) consulte:

- [PROJECT.md](PROJECT.md) — English
- [PROJECT-pt-BR.md](PROJECT-pt-BR.md) — Português

Para **como trabalhar neste repositório** (branches, commits, gates, regras de
docs) veja [CLAUDE.md](CLAUDE.md).

**Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · shadcn/ui
(Radix) · React Router 7 · TanStack Query 5 · React Hook Form + Zod 4 · MSW ·
Vitest · Playwright

> **Construído como tutorial.** Esta app foi montada passo a passo em dez guias
> em [`docs/`](./docs) — `TUTORIAL_01_setup.md` … `TUTORIAL_10_edit_permissions.md`.
> Eles são o "porquê"
> narrativo por trás de cada padrão documentado aqui; leia-os para o raciocínio,
> leia o `PROJECT.md` para a fotografia do estado atual.

## Funcionalidades

- **Mock-first / frontend-first** — cada endpoint tem um handler MSW em
  `src/api/mocks/` que espelha o backend **fielmente** (status codes, mensagens
  de erro, paginação). O mock **é o contrato**: a UI é construída e a suíte
  inteira fica verde antes de precisar da API real.
- **Dois modos de execução, um código** — `pnpm dev:test` roda contra o mock MSW
  no navegador (determinístico, sem backend); `pnpm dev` fala com a API real em
  `VITE_API_URL`. A chave é o **mode** do Vite (`test` liga o worker); nada mais
  muda.
- **Auth com boot silencioso** — o access token vive **só em memória** (anti-XSS);
  a durabilidade vem do **cookie httpOnly de refresh** da API. No carregamento a
  app faz refresh silencioso e restaura a sessão; um interceptor de 401
  (single-flight) faz refresh-and-replay de forma transparente.
- **RBAC na UI** — `ProtectedRoute` protege a área autenticada; `RequireScreen`
  protege cada tela por uma checagem `can(screenKey, action)` e renderiza
  `Forbidden` **no lugar** (o layout permanece). As permissões são lidas frescas
  de `GET /me/permissions`, nunca confiadas de um token velho.
- **Controle de acesso híbrido (RBAC)** — um papel fixo (`ADMIN` ignora tudo,
  `USER` segue os grants) mais **Profiles** dinâmicos que agrupam grants por tela
  (view/create/edit/delete). **Modules** agrupam **Screens**; os profiles carregam
  `is_default` (anexado no registro), e profiles, modules e screens carregam
  `is_system` — o catálogo de access-control do seed é protegido contra
  exclusão/renomeação de key (badge System + sem Delete nas tabelas admin). A **sidebar é
  dirigida por dados** — monta suas seções a partir do `menu` de
  `GET /me/permissions`, então cada usuário vê só as telas que pode ver. As telas
  de admin sob `/admin` gerenciam modules, screens, profiles (com um editor de
  grants drag-and-drop) e usuários (atribuir profiles, desativar). Uma **tela de
  destino padrão** por profile mais um **override** por usuário decidem onde cada
  um cai após o login.
- **Gate de verificação de e-mail** — um usuário não verificado vê um banner e a
  ação de check-in fica bloqueada; ao verificar, o banner some sem novo login
  (`reloadUser` refaz `/auth/me`).
- **Self-service de conta** — edite seu próprio username; troque seu e-mail por um
  fluxo de confirmação (OTP **ou** link), espelhando o pattern A do backend (o
  endereço comprovado permanece até o novo ser confirmado).
- **Área admin** — tabela de usuários paginada, página dedicada de edição de
  usuário (username/email/role/`is_verified`/`is_active` com as regras do backend,
  mais um card de profiles), as telas CRUD de controle de acesso (modules, screens,
  profiles) e edição de academia a partir do card (Dialog).
- **Academias & check-ins** — academias próximas por geolocalização + busca por
  nome; check-in a partir do card; histórico de check-ins com **Validate** para
  ADMIN; a home é um **dashboard** com gráfico de atividade em Recharts.
- **Presentation Model** — toda tela com lógica é um par: `x.tsx` (view pura) +
  `use-x-pm.ts` (estado, dados, formatação). As views não carregam lógica. Cada
  par vive em **sua própria pasta de mesmo nome**, pra o PM (prefixo `use-`)
  ficar ao lado da view em vez de ser ordenado pra longe dela.
- **Mobile-first** — utilitários Tailwind mobile-first; a sidebar vira um Sheet
  em telas pequenas (`useIsMobile`).
- **Env tipado e validado** — `src/env.ts` faz parse de `import.meta.env` com Zod
  e **falha rápido** em má configuração, igual ao backend.
- **Testado** — specs unit/componente com Vitest + Testing Library (happy-dom) ao
  lado do código, e uma suíte e2e Playwright dirigindo o navegador real contra o
  mock MSW.

## Setup

> Faz parte do **workspace pnpm `monorepo_sample`**. `pnpm install` aqui instala
> o workspace inteiro (um `pnpm-lock.yaml` na raiz); pode rodar também uma vez na
> raiz do repo. Este app depende de
> [`@root/contracts`](../packages/contracts/README-pt-BR.md) pros schemas Zod
> compartilhados (regra de senha dos forms + validação MSW contra o contrato).

```sh
pnpm install

# Modo mock — sem backend (mock MSW determinístico):
pnpm dev:test            # → http://localhost:5001

# Modo API real — precisa do solid_api_sample rodando na :3333:
cp .env.local.example .env.local   # ajuste VITE_API_URL (padrão http://localhost:3333)
pnpm dev                 # → http://localhost:3001
```

**Login de demonstração (modo mock):** qualquer email/username com a senha
`Password1!`. Entre como **`admin`** para receber um token de admin e alcançar
todas as telas (o admin ignora todos os grants). O seed também traz três membros
com profile, cada um caindo numa sidebar diferente:

- **`johndoe`** — profile `gym-member` (Dashboard, Gyms, Check-ins).
- **`manager`** — profile `gym-manager` (as telas de academia + criar academias +
  a tela admin de Users).
- **`support`** — profile `support` (as telas Profiles/Screens/Users de controle
  de acesso, sem telas de academia).

Qualquer outro identificador é um membro comum, sem profile. O mesmo comportamento
de RBAC vale no modo API real — o menu e as guardas vêm de `GET /me/permissions`.

No modo API real, registre-se pela UI (ou entre como o ADMIN do seed — veja as
envs `ADMIN_*` do `solid_api_sample`). O CORS da API precisa liberar esta origem
e o método `PATCH` (por isso o backend define `methods` explicitamente).

## Scripts

| Comando              | Descrição                                                   |
| -------------------- | ----------------------------------------------------------- |
| `pnpm dev`           | Dev server contra a API **real** (`http://localhost:3001`)  |
| `pnpm dev:test`      | Dev server em modo **mock**, MSW ativo (`:5001`)            |
| `pnpm build`         | Type-check (`tsc -b`) + build de produção (Vite)            |
| `pnpm preview`       | Servir o build de produção localmente                       |
| `pnpm test`          | Testes unit/componente (Vitest, watch)                      |
| `pnpm test:run`      | Testes unit/componente uma vez (modo CI)                    |
| `pnpm test:coverage` | Testes unit + relatório de cobertura V8                     |
| `pnpm test:e2e`      | Suíte e2e Playwright (sobe `dev:test` na `:5001` sozinha)   |
| `pnpm test:e2e:ui`   | Playwright em modo UI (câmera lenta)                        |
| `pnpm lint`          | ESLint (flat config)                                        |
| `pnpm lint:fix`      | ESLint com `--fix`                                          |
| `pnpm check`         | Prettier check (`src`)                                      |
| `pnpm format`        | Prettier write (`src`)                                      |
| `pnpm killapp`       | Libera as portas 3001/5001/4173 + mata processos Playwright |

## Variáveis de ambiente

`import.meta.env` é validado por Zod em `src/env.ts` — a app **lança erro no
boot** se uma variável faltar ou estiver malformada. Todas as vars da app têm
prefixo `VITE_` e portanto são **embutidas no bundle do cliente** — são
**públicas**. Nunca coloque segredo aqui.

Arquivos (o Vite carrega por mode; arquivos posteriores vencem):

| Arquivo              | Commitado | Carregado em          | Propósito                                         |
| -------------------- | :-------: | --------------------- | ------------------------------------------------- |
| `.env`               |    ✅     | todos os modes        | Vars de UX da política de senha (espelham a API)  |
| `.env.example`       |    ✅     | —                     | Template do `.env`                                |
| `.env.test`          |    ✅     | `--mode test`         | Modo mock: `VITE_API_URL=/`, sem delay artificial |
| `.env.local`         |    ❌     | `dev`/`build` (local) | Config local da API real (`VITE_API_URL`, delay)  |
| `.env.local.example` |    ✅     | —                     | Template do `.env.local`                          |

| Variável                   | Obrigatória | Exemplo / padrão                     | Descrição                                                                  |
| -------------------------- | ----------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `VITE_API_URL`             | sim         | `http://localhost:3333` · `/` (mock) | Base URL que o Axios usa. `/` no modo test (o MSW intercepta tudo).        |
| `VITE_ENABLE_API_DELAY`    | não         | `true` (dev) · `false` (test)        | Injeta delay artificial de 1–3 s por requisição para exercitar loadings.   |
| `VITE_PASSWORD_MIN_LENGTH` | sim         | `8`                                  | Tamanho mínimo de senha no registro/reset (espelha `PASSWORD_MIN_LENGTH`). |
| `VITE_PASSWORD_PATTERN`    | sim         | `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)…$`  | Regex de complexidade de senha (espelha `PASSWORD_PATTERN`).               |
| `VITE_PASSWORD_MESSAGE`    | sim         | "Must include upper- and lowercase…" | Mensagem exibida quando a senha falha na regex de complexidade.            |

> As vars de política de senha são **validação de UX no frontend apenas** — a API
> revalida no servidor. Mantenha-as em sincronia com o `.env` do backend para que
> cliente e servidor concordem sobre o que é uma senha válida.

## Rotas da app (páginas)

`src/routes.tsx` monta a árvore com o React Router. A área autenticada fica atrás
de `ProtectedRoute` (redireciona visitantes para `/sign-in`) e usa `AppLayout`
(sidebar + header); o índice `/` resolve a tela de destino do usuário via
`LandingRoute`, e cada tela é protegida por `RequireScreen screen='<chave>'
[action]` (o mesmo `can()` que o menu usa).

| Caminho                       | Guarda                    | Página             | Notas                                                           |
| ----------------------------- | ------------------------- | ------------------ | --------------------------------------------------------------- |
| `/`                           | Protected                 | LandingRoute       | Resolve a tela de destino do usuário (dashboard/primeira)       |
| `/gyms`                       | `gym.gyms`                | Gyms               | Próximas (geolocalização) + busca por nome                      |
| `/check-ins`                  | `gym.check-in`            | CheckIns           | Histórico; ADMIN vê **Validate**                                |
| `/account`                    | Protected                 | Account            | Editar username · trocar e-mail · escolher tela de destino      |
| `/gyms/new`                   | `gym.gyms` (create)       | NewGym             | Criar academia                                                  |
| `/admin/users`                | `access-control.users`    | AdminUsers         | Tabela de usuários paginada                                     |
| `/admin/users/:userId`        | `access-control.users`    | UserEdit           | Editar username/email/role/`is_verified`/`is_active` + profiles |
| `/admin/modules`              | `access-control.modules`  | AdminModules       | CRUD de modules                                                 |
| `/admin/screens`              | `access-control.screens`  | AdminScreens       | CRUD de screens (por module)                                    |
| `/admin/profiles`             | `access-control.profiles` | AdminProfiles      | CRUD de profiles                                                |
| `/admin/profiles/:profileId`  | `access-control.profiles` | ProfileDetail      | Editor de grants (TransferTable) + tela padrão                  |
| `/sign-in`                    | público (auth)            | SignIn             |                                                                 |
| `/register`                   | público                   | Register           |                                                                 |
| `/forgot-password`            | público (auth)            | ForgotPassword     |                                                                 |
| `/users/reset-password`       | público (auth)            | ResetPassword      | Token via `?token=` ou email + OTP                              |
| `/users/verify-email`         | público (auth)            | VerifyEmail        | Landing do link (`?token=`) + OTP                               |
| `/users/confirm-email-change` | público (auth)            | ConfirmEmailChange | Landing do link de troca de e-mail                              |
| `*`                           | —                         | NotFound           | 404                                                             |

O contrato da API que essas páginas consomem (rotas, papéis, formatos de erro)
está documentado no [README do `solid_api_sample`](../api/README.md).
O handler de mock de cada página em `src/api/mocks/` o espelha.

## Integração com o backend

- **Em dev (`pnpm dev`)** a app chama a API real em `VITE_API_URL`
  (padrão `http://localhost:3333`). Suba o `solid_api_sample` (`pnpm dev` +
  `pnpm seeddb`) antes.
- **CORS:** a API libera esta origem com `credentials:true` (necessário para o
  cookie de refresh) e lista `PATCH`/`PUT`/`DELETE` explicitamente — sem isso o
  preflight do navegador bloqueia todo `PATCH` (edições de conta/admin/academia).
- **Mapeamento de DTO:** as respostas da API são snake_case; a camada
  `src/api/*.ts` mapeia para os modelos camelCase da app (ex.: `is_verified` →
  `isVerified`). Campos Decimal (lat/long da academia) chegam como **strings** e
  são convertidos na camada de API.
- **Formato do auth:** o login retorna `{ token }` no corpo e seta o cookie
  httpOnly de refresh; `GET /auth/me` retorna `is_verified` e `role` frescos do
  banco, então o banner e a UI de RBAC reagem sem novo login.

## Testes

- **`pnpm test:run`** — Vitest + Testing Library (happy-dom). Specs de
  componente/PM/lib ficam **ao lado do código** (`src/**/*.spec.{ts,tsx}`). Um
  `renderWithProviders` compartilhado (`test/utils.tsx`) envolve a unidade num
  `MemoryRouter` + um `QueryClient` sem retry.
- **`pnpm test:e2e`** — Playwright (Chromium). Specs em `test/*.spec.ts`. A config sobe
  `pnpm dev:test` na `:5001` sozinha (MSW ativo), então o e2e roda contra o mock
  determinístico — sem backend, sem flakiness.

> **Ponto cego do mock.** happy-dom e o auto-wait do Playwright podem ambos
> esconder um bug real de cold-load em campos Radix controlados (um
> `Select`/`Switch` que semeia o valor de forma assíncrona). Alguns bugs só
> aparecem num **smoke manual no navegador** — veja o §Formulários do `PROJECT.md`
> e o callout do `TUTORIAL_10`.

## Verificação final

```sh
pnpm lint        # ESLint, sem erros
pnpm build       # type-check (tsc -b) + build de produção
pnpm test:run    # suíte unit/componente
pnpm test:e2e    # e2e Playwright (sobe o servidor de mock sozinho)
```

### Smoke manual (modo mock)

```sh
pnpm dev:test    # http://localhost:5001
```

1. Entre como `admin` / `Password1!` → cai no dashboard.
2. **Gyms** → permita a geolocalização → lista de próximas; busque por nome; faça
   check-in num card → toast + as métricas do dashboard atualizam.
3. **Check-ins** → o histórico mostra o check-in; como admin, **Validate** nele.
4. **Account** → renomeie seu username; inicie uma troca de e-mail → confirme com
   o OTP impresso pelo mock (ou a landing do link); escolha uma **Landing screen**
   (ou "Automatic") e confirme que o próximo login cai nela.
5. **Admin → Users** → abra um membro → mude role/`is_verified` → Save; confirme
   que a tabela reflete. Ao editar **você mesmo**, o papel vira um badge
   somente-leitura. Desligue o switch **Active** de um membro e confirme que ele
   não consegue mais entrar. Mova um profile no **card de profiles** do usuário e
   salve.
6. **Admin → Profiles** → abra um profile → no **editor de grants** arraste (ou use
   `>>`/`<<`) telas entre Available e Assigned, marque view/create/edit/delete,
   escolha a tela **Default** do profile → Save. **Modules** e **Screens** oferecem
   o mesmo CRUD para o catálogo.
7. Saia e entre como **`johndoe`**, **`manager`**, **`support`** em seguida — cada
   um vê uma **sidebar diferente** montada a partir dos grants do seu profile; o
   admin vê todas as seções. Visitar uma tela que você não tem renderiza
   **Forbidden** no lugar.

Para um smoke com **backend real**, rode `pnpm dev` contra o `solid_api_sample` e
percorra o mesmo fluxo (registre-se antes; verifique o e-mail pelo link/OTP
impresso no log do servidor da API).

## Licença

Distribuído sob a [Licença MIT](LICENSE).
