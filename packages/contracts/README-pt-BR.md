# @root/contracts

**Schemas Zod + tipos inferidos** compartilhados do monorepo: uma definição,
usada para **validação em runtime nos dois lados** (parse de request no backend +
validação de form/response no frontend) e como **fonte única dos tipos
TypeScript** (`z.infer`). É a camada "Zod único" — o coração da arquitetura
modelo. _(EN: [README.md](./README.md).)_

## Por que existe

`api/` (Fastify) e `web/` (React) são apps independentes que conversam por HTTP.
Sem contrato compartilhado, a forma de request/response é escrita **duas vezes**
(uma em cada app) e diverge em silêncio — um campo renomeado ou string de erro
mudada só aparece em runtime, em produção. Este pacote torna a **forma do fio**
um artefato único que os dois apps importam.

```
            ┌──────────────────────────────┐
            │      @root/contracts         │
            │  schemas Zod (wire) +        │
            │  tipos z.infer (1 fonte)     │
            └───────┬───────────┬──────────┘
                    │           │
        import      │           │      import
        ┌───────────▼──┐   ┌────▼──────────┐
        │     api/     │   │     web/      │
        │ controllers  │   │ PMs de form + │
        │ parse(body)  │   │ mocks MSW     │
        └──────────────┘   └───────────────┘
```

## Regras de design (leia antes de adicionar algo)

1. **Compartilhe a forma do fio, não a UI.** Os schemas descrevem o que vai
   **no fio** — `snake_case`, permissivo como o backend. Refinamentos só-de-UI
   (confirmar-senha, lowercase, mensagens localizadas) ficam **locais** em cada
   app e _derivam_ da forma compartilhada via `.pick()/.omit()/.extend()/
   .partial()`.
2. **Não force igualdade onde os apps legitimamente diferem.** O backend coage
   strings de query/body (`z.coerce`) e usa refinamentos de range próprios; o
   frontend manda valores já tipados e mostra erros localizados. Isso fica local
   — só as formas genuinamente idênticas vivem aqui. (Por isso coords de gym,
   paginação e o `transform` do username no register **não** são compartilhados.)
3. **Regras dirigidas por env são fábricas, não constantes.** Uma regra
   parametrizada por env (ex.: política de senha) é exportada como **fábrica**
   `make…Schema(options)`. Cada lado injeta seu env na chamada — env **nunca** é
   lido no import deste pacote.
4. **Mesma major do Zod nos dois lados.** Os dois apps estão em `zod@4`. A
   identidade de tipo do `z.infer` depende disso; subir um sem o outro quebra os
   tipos.

## Conteúdo

| Arquivo | Exports |
|---------|---------|
| `primitives.ts` | `usernameSchema`, `identifierSchema`, `emailSchema`, `roleSchema`, `pageQuerySchema` |
| `password.ts` | `makePasswordSchema({ min, pattern, message?, minMessage?, maxMessage? })`, `PasswordPolicy` |
| `auth.ts` | `loginBodySchema`, `authTokenResponseSchema` (+ tipos) |
| `users.ts` | `makeRegisterBodySchema`, `updateProfileBodySchema`, `updateUserBodySchema`, `makeResetPasswordBodySchema`, `requestEmailChangeBodySchema`, `otpCodeBodySchema` (+ tipos) |
| `gyms.ts` | `createGymBodySchema`, `updateGymBodySchema`, `searchGymsQuerySchema`, `nearbyGymsQuerySchema` (+ tipos) |
| `check-ins.ts` | `checkInBodySchema` (+ tipo) |
| `responses.ts` | `publicUserSchema`, `userResponseSchema` (+ tipos) — DTOs de resposta |
| `index.ts` | barrel — re-exporta tudo |

## Zero-build (source exports)

**Não há build.** O `package.json` aponta `main`/`types`/`exports` pra
`./src/index.ts`, e os consumidores compilam o TypeScript sozinhos — os dois apps
usam `moduleResolution: "bundler"` e transpilam dependências (`tsx`/`tsup` no
backend, `vite`/`vitest` no frontend). Typecheck isolado do pacote:

```sh
pnpm -C packages/contracts typecheck   # tsc --noEmit
```

## Como cada lado adota

- **Backend** (`api/`) — troca um schema Zod local pelo compartilhado **só onde a
  forma do fio é idêntica**. Schemas dirigidos por env injetam o env numa fábrica
  (veja `api/src/http/schemas/password-schema.ts`).
- **Frontend** (`web/`) — monta o schema do form a partir da forma compartilhada
  e adiciona refinamentos de UI localmente. Os forms de auth chamam
  `makePasswordSchema` com `VITE_PASSWORD_*` + suas mensagens de UX, e somam
  `confirmPassword`.
- **MSW** (`web/src/api/mocks/`) — valida requests contra o schema de request e
  faz `parse` das respostas pelo DTO de resposta, então um mock que divergir do
  contrato falha alto nos testes.

## Adicionar um schema (checklist)

1. Coloque no arquivo certo; exporte o schema **e** um tipo `z.infer`.
2. Modele a **forma do fio** (`snake_case`); deixe refinamentos de UI de fora.
3. Se depende de env, exporte uma **fábrica** `make…Schema(options)`.
4. Re-exporte do `index.ts`.
5. Adote incremental — backend, depois frontend, depois MSW — **gates verdes por
   etapa** (`lint` + typecheck/build + testes do app tocado).
