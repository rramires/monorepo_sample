# @root/contracts

Shared **Zod schemas + inferred types** for the monorepo: one definition, used
for **runtime validation on both sides** (backend request parsing + frontend
form/response validation) and as the **single source of the TypeScript types**
(`z.infer`). This is the "Zod único" layer — the heart of the model
architecture. _(pt-BR: [README-pt-BR.md](./README-pt-BR.md).)_

## Why it exists

`api/` (Fastify) and `web/` (React) are independent apps that talk over HTTP.
Without a shared contract, the request/response shape is written **twice** (once
in each app's Zod schemas) and drifts silently — a renamed field or changed
error string is only caught at runtime, in production. This package makes the
**wire shape** a single artifact both apps import.

```
            ┌──────────────────────────────┐
            │      @root/contracts         │
            │  wire-shape Zod schemas +    │
            │  z.infer types (one source)  │
            └───────┬───────────┬──────────┘
                    │           │
        import      │           │      import
        ┌───────────▼──┐   ┌────▼──────────┐
        │     api/     │   │     web/      │
        │ controllers  │   │ form PMs +    │
        │ parse(body)  │   │ MSW mocks     │
        └──────────────┘   └───────────────┘
```

## Design rules (read before adding anything)

1. **Share the wire shape, not the UI.** Schemas here describe what goes **on
   the wire** — `snake_case`, backend-permissive. UI-only refinements
   (confirm-password, lowercasing, localized messages) **stay local** to each
   app and _derive_ from the shared shape with `.pick()/.omit()/.extend()/
   .partial()`.
2. **Don't force equality where the apps legitimately differ.** The backend
   coerces query/body strings (`z.coerce`) and uses custom range refinements;
   the frontend sends typed values and shows localized errors. Those stay local
   — only the genuinely-identical shapes live here. (That is why gym coords,
   pagination, and the register username transform are **not** shared.)
3. **Env-driven rules are factories, not constants.** A rule parameterized by
   env (e.g. the password policy) is exported as a `make…Schema(options)`
   **factory**. Each side injects its own env at call time — env is **never**
   read at import time in this package.
4. **Same Zod major on both sides.** Both apps are on `zod@4`. `z.infer` type
   identity depends on it; bumping one without the other breaks the types.

## Contents

| File | Exports |
|------|---------|
| `primitives.ts` | `usernameSchema`, `identifierSchema`, `emailSchema`, `roleSchema`, `pageQuerySchema` |
| `password.ts` | `makePasswordSchema({ min, pattern, message?, minMessage?, maxMessage? })`, `PasswordPolicy` |
| `auth.ts` | `loginBodySchema`, `authTokenResponseSchema` (+ types) |
| `users.ts` | `makeRegisterBodySchema`, `updateProfileBodySchema`, `updateUserBodySchema`, `makeResetPasswordBodySchema`, `requestEmailChangeBodySchema`, `otpCodeBodySchema` (+ types) |
| `gyms.ts` | `createGymBodySchema`, `updateGymBodySchema`, `searchGymsQuerySchema`, `nearbyGymsQuerySchema` (+ types) |
| `check-ins.ts` | `checkInBodySchema` (+ type) |
| `responses.ts` | `publicUserSchema`, `userResponseSchema` (+ types) — response DTOs |
| `modules.ts` | `moduleSchema` (+ `is_active`), `createModuleBodySchema`, `updateModuleBodySchema` (+ types) |
| `screens.ts` | `screenSchema` (+ `is_active`/`is_enabled`), `screenWithPermissionsSchema`, `createScreenBodySchema`, `updateScreenBodySchema`, `listScreensQuerySchema` (+ types) |
| `permissions.ts` | `permissionActionSchema`, `permissionSchema`, `createPermissionBodySchema`, `updatePermissionBodySchema`, `screenPermissionSchema`, `menuScreenSchema` (carries `is_enabled`), `mePermissionsSchema` (+ types) — the curated permission catalog + the `GET /me/permissions` shape |
| `profiles.ts` | `profileSchema` (+ `is_active`), `profileScreenGrantSchema` (membership + `permission_ids`), `profileDetailSchema` (+ `default_screen_id`), `createProfileBodySchema`, `updateProfileBodySchema`, `setProfileGrantsBodySchema`, `assignUserProfilesBodySchema` (+ types) |
| `index.ts` | barrel — re-exports everything |

## Zero-build (source exports)

There is **no build step**. `package.json` points `main`/`types`/`exports` at
`./src/index.ts`, and consumers compile the TypeScript themselves — both apps use
`moduleResolution: "bundler"` and transpile dependencies (`tsx`/`tsup` on the
backend, `vite`/`vitest` on the frontend). Typecheck the package on its own with:

```sh
pnpm -C packages/contracts typecheck   # tsc --noEmit
```

## How each side adopts it

- **Backend** (`api/`) — swap a local Zod schema for the shared one **only where
  the wire shape is identical**. Env-driven schemas inject env into a factory
  (see `api/src/http/schemas/password-schema.ts`).
- **Frontend** (`web/`) — build the form schema from the shared shape, then add
  UI refinements locally. The auth forms call `makePasswordSchema` with
  `VITE_PASSWORD_*` + their UX messages, then add `confirmPassword`.
- **MSW** (`web/src/api/mocks/`) — validate requests against the request schema
  and parse responses through the response DTO, so a mock that drifts from the
  contract fails loudly in tests.

## Adding a schema (checklist)

1. Put it in the matching file; export the schema **and** a `z.infer` type.
2. Model the **wire shape** (`snake_case`); keep UI refinements out.
3. If it depends on env, export a `make…Schema(options)` **factory**.
4. Re-export from `index.ts`.
5. Adopt incrementally — backend, then frontend, then MSW — **green gates per
   step** (`lint` + typecheck/build + tests on the touched app).
