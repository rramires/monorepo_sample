# web — GymPass-style Frontend

React + TypeScript single-page app for the GymPass-style domain (gyms,
check-ins, account & admin). It is the **client** for
[`solid_api_sample`](../api) (the Fastify/Prisma API), built
**mock-first**: every screen ships against an MSW mock that mirrors the real API
contract, so the UI is finished and tested before the backend is wired in.

> 🇧🇷 Versão em português: [README-pt-BR.md](README-pt-BR.md)

## Architecture

For the full architecture reference (folder structure, the Presentation Model
and Context patterns, mobile-first, the mock-first method, data flow, auth/RBAC,
forms, tests) see:

- [PROJECT.md](PROJECT.md) — English
- [PROJECT-pt-BR.md](PROJECT-pt-BR.md) — Português

For **how to work on this repo** (branching, commits, gates, doc rules) see
[CLAUDE.md](CLAUDE.md).

**Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · shadcn/ui
(Radix) · React Router 7 · TanStack Query 5 · React Hook Form + Zod 4 · MSW ·
Vitest · Playwright

> **Built as a tutorial.** This app was assembled step by step across ten
> guides in [`docs/`](./docs) — `TUTORIAL_01_setup.md` …
> `TUTORIAL_10_edit_permissions.md`. They are
> the narrative "why" behind every pattern documented here; read them for the
> reasoning, read `PROJECT.md` for the snapshot.

## Features

- **Mock-first / frontend-first** — every endpoint has an MSW handler under
  `src/api/mocks/` that mirrors the backend **verbatim** (status codes, error
  messages, pagination). The mock **is the contract**: the UI is built and the
  whole suite is green before the real API is needed.
- **Two run modes, one codebase** — `pnpm dev:test` runs against the in-browser
  MSW mock (deterministic, no backend); `pnpm dev` talks to the real API at
  `VITE_API_URL`. The switch is the Vite **mode** (`test` enables the worker),
  nothing else changes.
- **Auth with silent boot** — the access token lives **in memory only**
  (anti-XSS); durability comes from the API's **httpOnly refresh cookie**. On
  load the app silently refreshes and restores the session; a single-flight 401
  interceptor refreshes-and-replays transparently.
- **RBAC in the UI** — `ProtectedRoute` gates the authed area; `RequireScreen`
  gates each screen by a `can(screenKey, action)` check and renders `Forbidden`
  **in place** (the layout stays). Permissions are read fresh from
  `GET /me/permissions`, never trusted from a stale token.
- **Hybrid access control (RBAC)** — a fixed role (`ADMIN` bypasses everything,
  `USER` follows grants) plus dynamic **Profiles** that bundle per-screen grants
  (view/create/edit/delete). **Modules** group **Screens**; profiles carry
  `is_default` (auto-attached on register), and profiles, modules and screens
  carry `is_system` — the seeded access-control catalog is protected from
  deletion/key rename (a System badge + no Delete in the admin tables). The
  **sidebar is data-driven** — it builds its sections from
  `GET /me/permissions`'s `menu`, so each user sees only the screens they may
  view. Admin screens under `/admin` manage modules, screens, profiles (with a
  drag-and-drop grants editor) and users (assign profiles, deactivate). A
  per-profile **default landing screen** plus a per-user **override** decide
  where each user lands after sign-in.
- **Email-verification gate** — an unverified user sees a banner and the
  check-in action is blocked; verifying clears the banner without a re-login
  (`reloadUser` refetches `/auth/me`).
- **Account self-service** — edit your own username; change your own email via a
  confirmation flow (OTP **or** link), mirroring the backend's pattern A (the
  proven address stays until the new one is confirmed).
- **Admin area** — paginated users table, a dedicated user-edit page
  (username/email/role/`is_verified`/`is_active` with the backend's rules, plus a
  profiles card), the access-control CRUD screens (modules, screens, profiles), and
  gym editing from the gym card (Dialog).
- **Gyms & check-ins** — geolocation-based nearby gyms + search by name; check
  in from a gym card; a check-in history with ADMIN **Validate**; the home page
  is a **dashboard** with a Recharts activity chart. Gyms soft-delete: the edit
  dialog has an **Active** toggle (confirm-on-deactivate); inactive gyms are
  hidden from members and refuse check-ins. Managers get the **full gym list**
  (non-geo, paginated) with a **Show deactivated** toggle that reveals inactive
  gyms in the list, plus a **Nearby only** toggle to preview the member's
  geolocation view.
- **Presentation Model** — every screen with logic is a pair: `x.tsx` (pure
  view) + `use-x-pm.ts` (state, data, formatting). Views carry no logic. Each
  pair lives in its **own same-named folder**, so the `use-`-prefixed PM stays
  next to its view instead of sorting away from it.
- **Mobile-first** — Tailwind mobile-first utilities; the sidebar collapses to a
  Sheet on small screens (`useIsMobile`).
- **Typed, validated env** — `src/env.ts` parses `import.meta.env` with Zod and
  **fails fast** on misconfig, exactly like the backend.
- **Tested** — Vitest + Testing Library unit/component specs (happy-dom) next to
  the code, and a Playwright e2e suite driving the real browser against the MSW
  mock.

## Setup

> Part of the **`monorepo_sample` pnpm workspace**. `pnpm install` here installs
> the whole workspace (single root `pnpm-lock.yaml`); you can also run it once at
> the repo root. This app depends on [`@root/contracts`](../packages/contracts/README.md)
> for shared Zod schemas (the auth-form password rule + MSW contract validation).

```sh
pnpm install

# Mock mode — no backend needed (deterministic MSW mock):
pnpm dev:test            # → http://localhost:5001

# Real-API mode — needs solid_api_sample running on :3333:
cp .env.local.example .env.local   # set VITE_API_URL (default http://localhost:3333)
pnpm dev                 # → http://localhost:3001
```

**Demo login (mock mode):** any email/username with the password `Password1!`.
Sign in as **`admin`** to get an admin token and reach every screen (admin
bypasses all grants). The seed also ships three profiled members, each landing on
a different sidebar:

- **`johndoe`** — `gym-member` profile (Dashboard, Gyms, Check-ins).
- **`manager`** — `gym-manager` profile (the gym screens + creating gyms + the
  Users admin screen).
- **`support`** — `support` profile (the access-control Profiles/Screens/Users
  screens, no gym screens).

Any other identifier is a plain member with no profile. The same RBAC behaviour
applies in real-API mode — the menu and guards come from `GET /me/permissions`.

For real-API mode, register through the UI (or log in as the seeded ADMIN — see
`solid_api_sample`'s `ADMIN_*` env). The API's CORS must allow this origin and
the `PATCH` method (the backend sets `methods` explicitly for that reason).

## Scripts

| Command              | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `pnpm dev`           | Dev server against the **real** API (`http://localhost:3001`) |
| `pnpm dev:test`      | Dev server in **mock** mode, MSW active (`:5001`)             |
| `pnpm build`         | Type-check (`tsc -b`) + production build (Vite)               |
| `pnpm preview`       | Serve the production build locally                            |
| `pnpm test`          | Unit/component tests (Vitest, watch)                          |
| `pnpm test:run`      | Unit/component tests once (CI mode)                           |
| `pnpm test:coverage` | Unit tests + V8 coverage report                               |
| `pnpm test:e2e`      | Playwright e2e suite (auto-boots `dev:test` on `:5001`)       |
| `pnpm test:e2e:ui`   | Playwright UI mode (slow-mo)                                  |
| `pnpm lint`          | ESLint (flat config)                                          |
| `pnpm lint:fix`      | ESLint with `--fix`                                           |
| `pnpm check`         | Prettier check (`src`)                                        |
| `pnpm format`        | Prettier write (`src`)                                        |
| `pnpm killapp`       | Free ports 3001/5001/4173 + kill stray Playwright procs       |

## Environment variables

`import.meta.env` is validated by Zod in `src/env.ts` — the app **throws on
boot** if a variable is missing or malformed. All app vars are prefixed `VITE_`
and are therefore **inlined into the client bundle** — they are **public**.
Never put a secret here.

Files (Vite loads them by mode; later files win):

| File                 | Committed | Loaded in             | Purpose                                          |
| -------------------- | :-------: | --------------------- | ------------------------------------------------ |
| `.env`               |    ✅     | all modes             | Password-policy UX vars (mirror the API)         |
| `.env.example`       |    ✅     | —                     | Template for `.env`                              |
| `.env.test`          |    ✅     | `--mode test`         | Mock mode: `VITE_API_URL=/`, no artificial delay |
| `.env.local`         |    ❌     | `dev`/`build` (local) | Local real-API config (`VITE_API_URL`, delay)    |
| `.env.local.example` |    ✅     | —                     | Template for `.env.local`                        |

| Variable                   | Required | Example / default                    | Description                                                             |
| -------------------------- | -------- | ------------------------------------ | ----------------------------------------------------------------------- |
| `VITE_API_URL`             | yes      | `http://localhost:3333` · `/` (mock) | Base URL Axios talks to. `/` in test mode (MSW intercepts everything).  |
| `VITE_ENABLE_API_DELAY`    | no       | `true` (dev) · `false` (test)        | Inject a 1–3 s artificial delay per request to exercise loading states. |
| `VITE_PASSWORD_MIN_LENGTH` | yes      | `8`                                  | Min password length on register/reset (mirror `PASSWORD_MIN_LENGTH`).   |
| `VITE_PASSWORD_PATTERN`    | yes      | `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)…$`  | Password complexity regex (mirror `PASSWORD_PATTERN`).                  |
| `VITE_PASSWORD_MESSAGE`    | yes      | "Must include upper- and lowercase…" | Message shown when the password fails the complexity regex.             |

> The password-policy vars are **frontend UX validation only** — the API
> re-validates server-side. Keep them in sync with the backend's `.env` so the
> client and server agree on what a valid password is.

## App routes (pages)

`src/routes.tsx` builds the tree with React Router. The authed area sits behind
`ProtectedRoute` (redirects guests to `/sign-in`) and uses `AppLayout` (sidebar

- header); the index `/` resolves to the user's landing screen via `LandingRoute`,
  and each screen is gated by `RequireScreen screen='<key>' [action]` (the same
  `can()` the menu uses).

| Path                          | Guard                     | Page               | Notes                                                         |
| ----------------------------- | ------------------------- | ------------------ | ------------------------------------------------------------- |
| `/`                           | Protected                 | LandingRoute       | Resolves to the user's landing screen (dashboard/first)       |
| `/gyms`                       | `gym.gyms`                | Gyms               | Nearby (geolocation) + search by name                         |
| `/check-ins`                  | `gym.check-in`            | CheckIns           | History; ADMIN sees **Validate**                              |
| `/account`                    | Protected                 | Account            | Edit username · change email · pick landing screen            |
| `/gyms/new`                   | `gym.gyms` (create)       | NewGym             | Create a gym                                                  |
| `/admin/users`                | `access-control.users`    | AdminUsers         | Paginated users table                                         |
| `/admin/users/:userId`        | `access-control.users`    | UserEdit           | Edit username/email/role/`is_verified`/`is_active` + profiles |
| `/admin/modules`              | `access-control.modules`  | AdminModules       | Modules CRUD                                                  |
| `/admin/screens`              | `access-control.screens`  | AdminScreens       | Screens CRUD (per module)                                     |
| `/admin/profiles`             | `access-control.profiles` | AdminProfiles      | Profiles CRUD                                                 |
| `/admin/profiles/:profileId`  | `access-control.profiles` | ProfileDetail      | Grants editor (TransferTable) + default screen                |
| `/sign-in`                    | public (auth)             | SignIn             |                                                               |
| `/register`                   | public                    | Register           |                                                               |
| `/forgot-password`            | public (auth)             | ForgotPassword     |                                                               |
| `/users/reset-password`       | public (auth)             | ResetPassword      | Token via `?token=` or email + OTP                            |
| `/users/verify-email`         | public (auth)             | VerifyEmail        | Link landing (`?token=`) + OTP                                |
| `/users/confirm-email-change` | public (auth)             | ConfirmEmailChange | Email-change link landing                                     |
| `*`                           | —                         | NotFound           | 404                                                           |

The API contract these pages consume (routes, roles, error shapes) is documented
in [`solid_api_sample`'s README](../api/README.md). Each page's
mock handler in `src/api/mocks/` mirrors it.

## Backend integration

- **In dev (`pnpm dev`)** the app calls the real API at `VITE_API_URL`
  (default `http://localhost:3333`). Start `solid_api_sample` (`pnpm dev` +
  `pnpm seeddb`) first.
- **CORS:** the API allows this origin with `credentials:true` (required for the
  refresh cookie) and lists `PATCH`/`PUT`/`DELETE` explicitly — without that the
  browser preflight blocks every `PATCH` (account/admin/gym edits).
- **DTO mapping:** API responses are snake_case; the `src/api/*.ts` layer maps
  them to the app's camelCase models (e.g. `is_verified` → `isVerified`). Decimal
  fields (gym lat/long) arrive as **strings** and are parsed in the API layer.
- **Auth shape:** login returns `{ token }` in the body and sets the httpOnly
  refresh cookie; `GET /auth/me` returns `is_verified` and `role` fresh from the
  DB so the banner and RBAC UI react without a re-login.

## Tests

- **`pnpm test:run`** — Vitest + Testing Library (happy-dom). Component/PM/lib
  specs live **next to the code** (`src/**/*.spec.{ts,tsx}`). A shared
  `renderWithProviders` (`test/utils.tsx`) wraps the unit in a `MemoryRouter`
  and a no-retry `QueryClient`.
- **`pnpm test:e2e`** — Playwright (Chromium). Specs live in `test/*.spec.ts`. The
  config auto-boots `pnpm dev:test` on `:5001` (MSW active), so e2e runs against
  the deterministic mock — no backend, no flakiness.

> **Mock blind spot.** happy-dom and Playwright's auto-wait can both hide a real
> cold-load bug in controlled Radix fields (a `Select`/`Switch` that seeds its
> value asynchronously). Some bugs only surface in a **manual browser smoke** —
> see `PROJECT.md` §Forms and the `TUTORIAL_10` callout.

## Final verification

```sh
pnpm lint        # ESLint, no errors
pnpm build       # tsc -b type-check + production build
pnpm test:run    # unit/component suite
pnpm test:e2e    # Playwright e2e (auto-boots the mock server)
```

### Manual smoke (mock mode)

```sh
pnpm dev:test    # http://localhost:5001
```

1. Sign in as `admin` / `Password1!` → land on the dashboard.
2. **Gyms** → allow geolocation → nearby list; search by name; check in from a
   card → toast + the dashboard metrics update.
3. **Check-ins** → history shows the check-in; as admin, **Validate** it.
4. **Account** → rename your username; start an email change → confirm with the
   OTP printed by the mock (or the link landing); pick a **Landing screen** (or
   "Automatic") and confirm the next sign-in lands there.
5. **Admin → Users** → open a member → change role/`is_verified` → Save; confirm
   the table reflects it. Editing **yourself** shows a read-only role badge.
   Toggle a member's **Active** switch off and confirm they can no longer sign in.
   Move a profile in the user's **profiles** card and Save.
6. **Admin → Profiles** → open a profile → in the **grants editor** drag (or use
   `>>`/`<<`) screens between Available and Assigned, tick view/create/edit/delete,
   pick the profile's **Default** screen → Save. **Modules** and **Screens** offer
   the same CRUD for the catalog.
7. Sign out and sign in as **`johndoe`**, **`manager`**, **`support`** in turn —
   each sees a **different sidebar** built from its profile's grants; admin sees
   every section. Visiting a screen you lack renders **Forbidden** in place.

For a **real-backend** smoke, run `pnpm dev` against `solid_api_sample` and walk
the same flow (register first; verify email via the link/OTP printed to the API
server log).

## License

Released under the [MIT License](LICENSE).
