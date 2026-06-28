# PROJECT.md — Frontend Architecture Reference

> Architecture reference for this example frontend. Serves as a **blueprint**
> for starting new, larger React apps that reuse the same structure, patterns
> (Presentation Model, Context, mock-first) and conventions. Written to be
> understood by both **humans** and **AIs** that will replicate the pattern.

> 🇧🇷 Versão em português: [PROJECT-pt-BR.md](PROJECT-pt-BR.md)

---

## 1. Overview

A "GymPass-style" single-page app (gyms, check-ins, account & admin) and the
**client** for the [`solid_api_sample`](../api) API. The domain is
secondary — what matters is the **replicable architecture**: a mock-first
workflow, a strict view/logic split (Presentation Model), Context for
cross-cutting state, and a typed data layer over a real REST API.

### Stack

| Concern         | Technology                                                           | Version |
| --------------- | -------------------------------------------------------------------- | ------- |
| UI library      | React                                                                | 19.2    |
| Language        | TypeScript                                                           | 6.0     |
| Build / dev     | Vite + `@vitejs/plugin-react`                                        | 8 / 6   |
| Styling         | Tailwind CSS (`@tailwindcss/vite`)                                   | 4.3     |
| Components      | shadcn/ui (style `radix-nova`) over `radix-ui`                       | 4 / 1.5 |
| Icons           | lucide-react                                                         | 1.18    |
| Routing         | React Router                                                         | 7.17    |
| Server state    | TanStack Query (`@tanstack/react-query`)                             | 5.10    |
| Forms           | React Hook Form + `@hookform/resolvers`                              | 7.79    |
| Validation      | Zod (**v4** — syntax differs from v3)                                | 4.4     |
| HTTP            | Axios                                                                | 1.18    |
| Toasts          | sonner                                                               | 2.0     |
| Charts          | Recharts                                                             | 3.8     |
| OTP input       | input-otp                                                            | 1.4     |
| Class utilities | clsx · tailwind-merge · tailwind-variants · class-variance-authority | —       |
| Font            | `@fontsource-variable/geist`                                         | 5.2     |
| API mocking     | MSW (`msw/browser`)                                                  | 2.14    |
| Unit tests      | Vitest + Testing Library + happy-dom                                 | 4 / 16  |
| E2E tests       | Playwright (Chromium)                                                | 1.61    |
| Lint / format   | ESLint 10 (flat) + Prettier 3.8 + simple-import-sort                 | —       |
| Package manager | pnpm                                                                 | 11.5    |

---

## 2. Architectural Principles

### 2.1 Mock-first (frontend-first)

Every screen is built and tested **before** the real backend is involved. For
each API endpoint there is:

- a thin client function in `src/api/<name>.ts` (the Axios call + DTO→model
  mapping), and
- an MSW handler in `src/api/mocks/<name>-mock.ts` that mirrors the backend
  **verbatim** — same status codes, same `message` strings, same pagination.

**The mock is the contract.** The UI, the unit suite and the e2e suite all run
green against the mock; swapping in the real API is just changing the Vite mode
(`VITE_API_URL`). When the backend ships, the mock is the spec it must satisfy.

### 2.2 Presentation Model (view / logic split)

Any component with logic is a **pair**:

- `x.tsx` — the **view**: pure JSX, props in, markup out. No `useState`, no data
  fetching, no formatting.
- `use-x-pm.ts` — the **Presentation Model**: all state, data (Query/Mutation),
  validation, derived/formatted values, event handlers. Returns a flat object
  the view spreads (`const pm = useXPM()`).

Trivial, logic-free components stay single-file. The view body is reduced to
`const pm = useXPM()` then `return` — nothing in between (no `useState`, hook,
derived value or handler). The split keeps views trivially readable and the logic
unit-testable in isolation. Gold standard: `account/email-card.tsx` +
`account/use-email-card-pm.ts`.

**Flat pair.** Keep `use-x-pm.ts` **next to** its `x.tsx` in the same folder. The
`use-` prefix sorting a step away from the view is an accepted minor cost — the
pair stays flat (see `account/`, `gyms/`, the admin list/dialog pages). A
**route-level page** or a component with its **own sub-tree** (sub-components,
nested files) gets a folder named after it — `auth/sign-in/`,
`…/profiles/profile-detail/`, `…/users/user-edit/` — holding that same flat pair.

### 2.3 Context for cross-cutting state — the 3-file pattern

Global state that many screens read (auth, theme, page title) uses React
Context, split into **three files** so a provider component and its consumer
hook never share a module (keeps React Fast Refresh happy and the boundaries
clean):

- `x-context.ts` — `createContext` + the value/type definitions (no component).
- `x-provider.tsx` — the provider component: state, effects, the methods.
- `x-hooks.ts` — the `useX()` consumer (`useContext`).

Applied to `components/auth/`, `components/theme/`, `components/title/`. Server
state does **not** go here — that is TanStack Query's job (§4). Context holds
only session/UI state.

### 2.4 Component hierarchy (the cascade)

When a UI piece is needed, descend this ladder — never skip straight to custom
CSS:

1. First try a **shadcn/ui** component.
2. If it doesn't exist, use a **[Radix UI](https://www.radix-ui.com/primitives)**
   primitive and style it.
3. If Radix doesn't have it either, build it with **Tailwind**
   (+ `tailwind-merge` / `tailwind-variants`, as in `components/ui-sample/`).
4. As a last resort, custom CSS in **`global.css`**.

> shadcn/ui **is** Radix + Tailwind — its components are Radix primitives,
> pre-styled. So the cascade is just stepping down one level in the same stack.

### 2.5 Mobile-first & responsive bands

Tailwind utilities are authored mobile-first (unprefixed = small screens,
`sm:`/`md:`/`lg:` add up). `useIsMobile()` (`hooks/use-mobile.ts`, a
`useSyncExternalStore` over a `matchMedia` query, breakpoint 768px) drives the
sidebar's **Sheet** vs. persistent rendering.

The wider layout follows **three bands** on Tailwind's default breakpoints —
`hooks/use-layout-band.ts` → `useLayoutBand()` (a `useSyncExternalStore` over two
`matchMedia` queries; the pure `getBandForWidth` is unit-tested):

- **mobile** `< md` (768) — sidebar is a slide-over Sheet; single column.
- **tablet** `md–lg` (768–1023) — sidebar defaults to the icon **rail**; content
  is "compact".
- **desktop** `≥ lg` (1024) — sidebar expanded; full multi-column layout.

The sidebar's open default is band-driven (rail on tablet, expanded on desktop);
a manual toggle sticks within a band and re-snaps to the band default when the
viewport crosses a breakpoint (`app-layout.tsx`, derived state — no
setState-in-effect). Content is **compact below `lg`** (tablet **and** mobile):
wide data tables become cards (`ResponsiveList`, §8), multi-column forms collapse
to one column, list pages sit inside a `Card`, and touch targets grow on phones.

### 2.6 Dependency direction

```
pages / components (views)
        │  use
        ▼
   use-*-pm.ts (Presentation Models)         components/{auth,theme,title} (Context)
        │  call                                        │
        ▼                                              ▼
   src/api/*.ts (typed client)  ──────────────►  lib/api.ts (Axios + interceptors)
        │  (in test mode)                              │
        ▼                                              ▼
   src/api/mocks/* (MSW handlers)                 real backend (VITE_API_URL)
```

Views never call Axios directly; PMs never build JSX. The `src/api` layer is the
only place that knows wire shapes (snake_case) and maps them to app models
(camelCase).

---

### 2.7 Shared contract (`@root/contracts`)

Request/response **wire shapes** (`snake_case`) live once in the
`@root/contracts` workspace package and are imported by both apps. The auth-form
password rule is built from its `makePasswordSchema` factory (this app injects
`VITE_PASSWORD_*` + UX messages, then adds `confirmPassword`); the MSW mocks
validate requests against the shared request schema and `parse` responses through
the response DTO (`userResponseSchema`) so they can't drift from the backend.
UI-only refinements stay local. See the monorepo
[`PROJECT.md`](../PROJECT.md) and the package
[README](../packages/contracts/README.md).

---

## 3. Folder Structure

```
src/
├── main.tsx                 # entry: enableMSW().then(render(<App/>))
├── app.tsx                  # provider stack: Theme → Title → Query → Auth → Router + Toaster
├── routes.tsx               # React Router tree (Protected → AppLayout → RoleRoute)
├── env.ts                   # Zod-validated import.meta.env (fail-fast)
├── global.css               # Tailwind v4 entry + theme tokens + @custom-variant dark
├── api/
│   ├── <name>.ts            # one function per endpoint (Axios call + DTO→model map)
│   └── mocks/
│       ├── <name>-mock.ts   # MSW handler mirroring the backend route
│       ├── *-data.ts        # mutable in-memory mock state (users, gyms, check-ins)
│       ├── data/            # access-control-seed.ts (single source for the RBAC dataset)
│       ├── mock-auth.ts     # computePermissions · resolveDefaultScreen · buildMenu · token↔user
│       ├── verified-state.ts# shared mock flag (email verification)
│       └── index.ts         # setupWorker(...handlers) + enableMSW() (test mode only)
├── components/
│   ├── auth/                # AuthContext/Provider/hooks · ProtectedRoute · RequireScreen (view grant + kill-switch) · LandingRoute · Forbidden · verify-email-banner/
│   ├── theme/               # ThemeContext/Provider/hooks · mode-toggle
│   ├── title/               # TitleContext/Provider · page-title (per-page document.title)
│   ├── breadcrumb/          # BreadcrumbContext/Provider/hooks · breadcrumbs (header trail) + use-breadcrumbs-pm
│   ├── app-sidebar/         # app-sidebar.tsx (view) + use-app-sidebar-pm.ts (data-driven from /me/permissions.menu)
│   ├── transfer-table/      # reusable two-table multi-select + dnd-kit assignment widget
│   ├── responsive-list/     # ResponsiveList: shadcn Table on desktop, column-driven cards < lg
│   ├── pager/               # shared Pager (first/prev/next/last + "from–to of total", or simple prev/next)
│   ├── ui/                  # shadcn/ui components (generated; do not hand-edit casually) · multi-select.tsx = lean chips MultiSelect on Popover + Command (cmdk) + Badge
│   └── ui-sample/           # cascade tier-3 reference: custom Tailwind + tailwind-variants
├── hooks/
│   ├── use-mobile.ts        # useIsMobile (matchMedia)
│   ├── use-layout-band.ts   # useLayoutBand → 'mobile' | 'tablet' | 'desktop' (md/lg)
│   ├── use-permissions.ts   # usePermissions() + can(screenKey, action) + isScreenEnabled; ADMIN bypasses
│   └── use-check-in.ts      # shared check-in mutation (geo + POST + invalidate)
├── lib/
│   ├── api.ts               # Axios instance + interceptors (token attach, 401 single-flight refresh)
│   ├── auth-store.ts        # in-memory access token (get/set/clear)
│   ├── react-query.ts       # the QueryClient singleton
│   ├── geolocation.ts       # getCurrentPosition wrapper (browser Geolocation API)
│   ├── check-in-activity.ts # derive the dashboard chart series from history
│   └── utils.ts             # cn() (clsx + tailwind-merge)
└── pages/
    ├── _layouts/            # app-layout/ · auth-layout · register-layout
    ├── app/                 # authed area: home/ (dashboard) · gyms/ · check-ins/ · account/ · new-gym/ · admin/{modules,screens/(+permissions-editor/),profiles/(+profile-detail/),users/(+user-edit/)}
    ├── auth/                # sign-in/ · forgot-password/ · reset-password/ · verify-email/ · confirm-email-change/
    ├── register/
    ├── e404.tsx · error.tsx
```

### Naming conventions

- **View + PM pair:** `x.tsx` (view) + `use-x-pm.ts` (logic). Spec: `x.spec.tsx`
  next to them.
- **Context:** `x-context.ts` + `x-provider.tsx` + `x-hooks.ts`.
- **API client:** `src/api/<verb-noun>.ts` exporting `<verbNoun>()` (e.g.
  `get-profile.ts` → `getProfile`). Its mock: `src/api/mocks/<verb-noun>-mock.ts`
  exporting `<verbNoun>Mock`.
- **Shared data hook:** `src/hooks/use-x.ts` (not page-bound; reusable action).
- **Imports** are auto-sorted (`simple-import-sort`); the `@/` alias = `src/`.

---

## 4. Data & Request Flow

### 4.1 The Axios instance (`lib/api.ts`)

A single `api` instance with `baseURL = VITE_API_URL` and
`withCredentials: true` (sends/receives the refresh cookie). Interceptors:

1. **(dev only) artificial delay** — when `VITE_ENABLE_API_DELAY`, a 1–3 s delay
   per request to exercise loading states.
2. **token attach** — reads the in-memory access token (`auth-store`) and sets
   `Authorization: Bearer <token>`.
3. **401 refresh-and-replay** (response interceptor) — on a `401` (except on the
   auth routes themselves), it calls `PATCH /auth/refresh` **once**, stores the
   new token and replays the original request. Concurrent 401s share **one**
   refresh promise (single-flight) because the refresh cookie is single-use; if
   refresh fails, the token is cleared and the app redirects to `/sign-in`.

### 4.2 The typed client (`src/api/*.ts`)

One function per endpoint. It owns the **wire shape** and maps it to the app
model — e.g. `getProfile()` calls `GET /auth/me` and maps
`{ is_verified, … }` (snake_case DTO) → `{ isVerified, … }` (camelCase model).
Request bodies are typed (`SignInBody`, `UpdateUserBody`, …) and shared with the
matching mock so the mock can't drift from the client.

### 4.3 Server state — TanStack Query

- **Reads:** `useQuery({ queryKey, queryFn, enabled })`. Query keys are arrays
  namespaced by resource (`['gyms','nearby',coords]`, `['check-ins', …]`).
  `enabled` gates dependent fetches (e.g. nearby gyms wait for geolocation).
- **Writes:** `useMutation({ mutationFn })`; on success the relevant keys are
  **invalidated** so dependent screens refetch (e.g. a check-in invalidates
  `['check-ins']`, refreshing both the history and the dashboard).
- One `QueryClient` (`lib/react-query.ts`) provided at the app root. Tests build
  a throwaway no-retry client per render.
- **Local UI state** (form values, a wizard step, a search box) stays in
  `useState` inside the PM — Query is for **server** state only.

### 4.4 Error handling

PMs catch mutation errors and surface the backend's message via sonner:
`(isAxiosError(err) && err.response?.data?.message) || '<generic fallback>'`.
4xx responses carry a human `message` (mirrored by the mocks); 5xx falls back to
the generic string.

---

## 5. Auth & RBAC

### 5.1 Token model (anti-XSS)

- The **access token lives in memory only** (`lib/auth-store.ts`) — never in
  `localStorage`/`sessionStorage`. A page reload loses it on purpose.
- **Durability is the API's httpOnly refresh cookie**, which JavaScript cannot
  read. On boot the app calls `PATCH /auth/refresh` to mint a fresh access token
  from the cookie.

### 5.2 Silent boot & session lifecycle (`auth-provider.tsx`)

`AuthProvider` holds `{ status: 'loading'|'authed'|'guest', user }`:

- **boot:** try `refresh()` → `getProfile()`; success → `authed`; any failure →
  `guest` (silent, no error toast — a guest is normal).
- **signIn(token):** store token, load profile, go `authed`.
- **signOut():** call the API, then clear token + user → `guest`.
- **reloadUser():** refetch `/auth/me` to pick up server changes (e.g.
  `is_verified` flips to true after verifying — the banner clears with no
  re-login).

`useAuth()` (`auth-hooks.ts`) exposes this to any component.

### 5.3 Route guards

- **`ProtectedRoute`** (wraps the whole app area): `loading` → spinner;
  `guest` → `<Navigate to="/sign-in">`; `authed` → `<Outlet/>`.
- **`RoleRoute allow={[...]}`** (sits **inside** `ProtectedRoute`, so the user is
  already authed): renders the child route only if `user.role` is allowed;
  otherwise renders **`Forbidden` in place** — the surrounding `AppLayout`
  (sidebar/header) stays put, so it reads as "you can't see this panel," not a
  full-page error. The role comes from `useAuth()` (fresh from `/auth/me`),
  never from a decoded token.

### 5.4 Email-verification gate (UI side)

`GET /auth/me` returns `isVerified`. While `false`, `verify-email-banner`
prompts the user and the check-in action is blocked (or the `403` is handled).
After the user verifies (link/OTP), `reloadUser()` refetches `/auth/me` and the
banner clears — no re-login, mirroring the backend's fresh-from-DB read.

### 5.5 Access control (RBAC)

Beyond the coarse `role`, the app has a **hybrid RBAC** model: a fixed role
(`ADMIN` bypasses everything, `USER` follows grants) plus dynamic **Profiles**.
A profile is **membership** (which screens show in the sidebar) + **granted
permissions** (per screen) + a **landing screen**. Permissions are a **curated
catalog per screen with friendly, editable labels** — e.g. `gym.gyms` offers
"View" + "Add" + "Check in"; `gym.gyms` and `access-control.users` deliberately
have no `delete` (they deactivate via an Active switch). An action is a **free
string KEY** — a bare CRUD family (`create`) or a composed `family_name`
(`create_checkin`, `edit_validate`); the family (before the first `_`) must be
one of `view`/`create`/`edit`/`delete`. `can(screenKey, action)` checks the key;
the label is **presentation only**. An extra op lives on its real screen instead
of spawning a phantom one — so the **Check in** button on the Gyms page is gated
by `gym.gyms.create_checkin`, and **Validate** on Check-ins by
`gym.check-ins.edit_validate`. `view` is now an **explicit grant**
(not default-true). **Modules** group **Screens**; a
profile carries `is_default` (auto-attached to a user on register), and profiles,
modules and screens carry `is_system` (protected — the key can't change and it
can't be deleted). Screens additionally carry `is_active` (lifecycle) and
`is_enabled` (an emergency **kill switch**); modules and profiles carry
`is_active`. The seed marks the access-control module + its screens (and all
three profiles) as system. A user may hold several profiles; their grants
**merge** (OR).

- **`usePermissions()` / `can()` / `isScreenEnabled()`** (`hooks/use-permissions.ts`)
  — loads `GET /me/permissions` as **server state** (TanStack Query, keyed by
  user id, so a different user refetches), exposes `can(screenKey, action='view')`
  and `isScreenEnabled(screenKey)` (the per-screen kill switch). ADMIN
  short-circuits both to `true`; while loading, `can()` is conservatively `false`
  so nothing flashes before grants resolve. The permission model
  (`get-me-permissions.ts`) carries `screens` (the grants), `menu` (the
  membership catalog, each entry with `isEnabled`) and `defaultScreenKey`.
- **`RequireScreen screen='<key>' [action]`** (`components/auth/require-screen.tsx`)
  — the route-level mirror of `can()`. Sits **inside** `ProtectedRoute`; renders
  the child route only when the user `can()` the action, else **`Forbidden` in
  place** (layout stays) with **one of two messages**: no `view` grant → "You
  don't have access to this screen yet."; a granted-but-killed screen
  (`isScreenEnabled` false) → "This screen is temporarily unavailable." (admin
  bypasses both). The backend enforces the same with `requireScreen` (defense in
  depth). This **replaces** the older role-only `RoleRoute` for the screen-gated
  routes.
- **`LandingRoute`** (`components/auth/landing-route.tsx`) — the index (`/`)
  resolver: sends the user to their preferred `defaultScreenKey` → the gym
  Dashboard if viewable → their first available screen → renders Home. Avoids a
  Forbidden on login.
- **Membership-driven sidebar** (`app-sidebar/use-app-sidebar-pm.ts`) — builds
  its sections from `permissions.menu` (the user's **membership** screens,
  grouped and ordered by module/screen order), intersected with `NAV_ENTRIES`
  (the screens that have a real page + their icon/label). A screen assigned with
  **zero permissions still appears** (staged rollout) — membership, not the
  `view` grant, drives the menu. It **no longer fetches** `/modules` +
  `/screens`; the menu grows as more pages get built. Active state uses a
  **segment match** (`isItemActive`), not exact equality, so a parent item stays
  lit on its sub-routes (e.g. "Gyms" while on `/gyms/new`, "Users" while editing
  `/admin/users/:id`); Dashboard (`/`) matches only itself.
- **Header breadcrumb** (`breadcrumb/`) — the `app-layout` header fills its space
  with a breadcrumb trail. A small PM (`use-breadcrumbs-pm`) derives the static
  trail from the route (`Gyms › New gym`, `Profiles › <name>`); detail pages
  publish the loaded entity's name as the dynamic leaf via `useSetBreadcrumb`
  (cleared on unmount so it can't leak onto the next route). It's a context trio
  (`breadcrumb-context`/`-provider`/`-hooks`) like `title/`; page body
  titles/descriptions are unchanged. A **lone crumb** (a top-level page) is
  **muted** — it only repeats the page title below it, and using the same grey as
  parent links means the crumb doesn't flicker color when you drill into a
  sub-page and it becomes the link.
- **`PageHeader`** (`components/page-header.tsx`) — the shared page header every
  page uses: a compact (logo-sized `text-xl`) title + muted description on the
  left, an optional `leading` slot (back button) and right-aligned actions
  bottom-aligned to the description (`items-end`). Centralizes title sizing and
  header spacing so the pages stay uniform. Card-form pages (user-edit, account,
  new-gym) keep their own card heading.
- **Admin screens** (`pages/app/admin/`) — each a view + PM pair, gated by its
  `access-control.*` screen key:
    - **Modules** (`/admin/modules`) and **Screens** (`/admin/screens`) — CRUD the
      catalog (dialogs for create/edit; deleting a screen cascades its grants).
      System rows show a **System** badge and hide Delete; deactivated rows show
      an **Inactive** badge. The edit dialog makes a system record's identity
      read-only (the `key`, and a screen's `module` / `path`) — the backend also
      returns `409`. The **module** dialog gained an **Active** switch; the
      **screen** dialog gained two: **Active** (`is_active` — hidden from the
      "add" pickers; confirm-on-deactivate via `useConfirmDeactivate`) and **On**
      (`is_enabled` — the emergency kill switch; confirm-on-off). A disabled
      module is hidden from the screen dialog's module Select (the screen's
      current module is kept so editing never drops a valid selection).
    - **Per-screen permission editor** (`screens/permissions-editor/`) — a
      todo-style editor opened by a clipboard-pen button per Screens row. It lists
      the screen's curated permissions (each an op **Badge** — a bare family
      reads "View"/"Create"…, a composed key shows its raw `family_name` — + its
      friendly **label**); you **add** a row (Operation `Select` of the four
      families + **`Other…`**, which reveals a Family `Select` + a Name `Input`
      with a live composed-key preview; bare families already on the screen are
      hidden), **rename** a label inline (pencil → confirm), and **delete** a
      non-system row (confirm). The action key is the code contract; the label is
      free text.
      Backend `409`s surface as toasts; the catalog is invalidated under the
      `['permissions']` prefix so the profile-detail picker refreshes too.
    - **Profiles** (`/admin/profiles`) — CRUD profiles (with `is_default`/`is_system`
      badges, plus an **Inactive** badge when deactivated); **ProfileDetail**
      (`/admin/profiles/:profileId`) edits one profile via the **`TransferTable`**
      (membership: which screens land in the sidebar). The Granted side replaces
      the old per-action checkbox columns with **one `Permissions` column** — a
      chips **`MultiSelect`** per screen choosing which of that screen's curated
      permissions are granted — plus a **Landing** checkbox (the profile's
      `default_screen_id`, enabled only for a viewable screen). Each screen row
      shows a **Module** column on both sides, and a chips `MultiSelect` above the
      table filters the **Available** side by module (already-granted screens
      always stay, so the Granted side never loses rows); the table search also
      matches the module name. A **disabled** screen still granted shows muted
      with a **Disabled** badge and is **removable one-way** (confirm-on-remove;
      can't be re-added until re-enabled), while the Available side hides disabled
      screens. The profile also has an **Active** switch (confirm-on-deactivate).
      The **Default profile** switch enforces the single-default invariant: it is
      **disabled when this profile is already the default** (promote another to
      move it), and promoting a non-default profile opens a confirm dialog naming
      the current default before saving (the backend demotes the old one and
      rejects turning the last default off with `409`).
    - **Users** (`/admin/users`) — paginated table; **UserEdit**
      (`/admin/users/:userId`) edits username/email/role/`is_verified` plus an
      **Active** switch (`is_active`; self-deactivation blocked) and a **profiles**
      card (a `TransferTable` assigning profiles — disabled profiles are hidden
      from the picker unless already assigned; admins show a read-only note).
      Deactivating a user blocks login and cuts access on the next request;
      saving with Active turned off prompts a confirm dialog first (the
      confirm-on-deactivate pattern below).
- **Per-user default landing screen** (`pages/app/account/landing-card.tsx`) —
  lets a user pick which of _their_ screens to land on after sign-in; "Automatic"
  clears the override (`default_screen_key: null` via `PATCH /auth/me`), falling
  back to the profile's default. Saving invalidates `['me-permissions']`.

The MSW mock mirrors the backend verbatim: `mocks/data/access-control-seed.ts` is
the single dataset (modules, screens, the **per-screen permission catalog**,
profiles with membership + granted permission ids + a landing screen, and
user↔profile links); `mocks/mock-auth.ts` holds `computePermissions` (merge a
user's profile grants; ADMIN gets all), `resolveDefaultScreen`, `buildMenu` and
the token↔user mapping; the `*-mock.ts` handlers serve `/modules`, `/screens`,
`/permissions` (+ `/screens/:id/permissions`), `/profiles`,
`/users/:id/profiles` and `/me/permissions`.

---

## 6. Forms

- **React Hook Form + Zod 4.** The Zod schema lives in the PM; `zodResolver` wires
  it to `useForm`. The view renders fields via `pm.register(...)` (or a
  `Controller` for controlled inputs like Radix `Select`/`Switch` and `input-otp`)
  and shows `pm.errors.<field>.message`.
    > **Zod is v4+** (`zod@^4`) — the schema syntax changed from v3 (e.g. some
    > APIs/error-customization moved or were deprecated). Write v4 syntax; when
    > copying snippets from older examples, port the deprecations.
- **Submit:** `handleSubmit(onSubmit)`; `onSubmit` runs the mutation, toasts
  success/error, navigates.
- **React 19 typing:** use `React.SubmitEvent` (not the deprecated `FormEvent`).
- **Keyboard / focus.** A screen meant for typing focuses its **first field** on
  mount (`autoFocus` on the first input — auth screens, new-gym, user-edit,
  profile-detail; admin create/edit dialogs get it for free from Radix's focus
  scope). Secondary links come **after** the primary action in tab order — on
  sign-in, "Forgot your password?" sits below the Sign in button so the order is
  identifier → password → Sign in → Forgot.
- **Deactivation (soft-delete) = confirm-on-save toggle.** When an entity supports
  soft-delete, its active state is an **Active `Switch` inside the edit form** (not
  a separate Delete-style button). On submit, if Active went **ON → OFF**,
  `useConfirmDeactivate` (`hooks/use-confirm-deactivate.ts`) opens a controlled
  `ConfirmDialog` **before** committing; reactivating or any other edit saves
  straight through. The PM calls `guardSave({ wasActive, willBeActive, save })`
  from `onSubmit` and spreads `dialogProps` onto the dialog. Two consumers:
  `user-edit` (admin) and the **gym edit dialog** (`edit-gym-dialog`, in-place on
  the shared Gyms page). Apply this to every deactivatable entity so the UX stays
  uniform. For gyms, an inactive gym also shows an **Inactive** badge, disables
  Check-in, and is hidden from members. Managers get the **full gym list**
  (non-geo, paginated via an empty-query search) with two toggles: **Show
  deactivated** reveals inactive gyms in the list (`includeInactive`, enforced
  server-side) and **Nearby only** opts into the member's geolocation view.

### Async-seeded forms — known gotchas (admin user-edit)

A form whose defaults arrive from an async fetch (the admin user-edit page) hit
real bugs that **only a manual browser smoke caught** — happy-dom renders Radix
values eagerly and Playwright's auto-wait waits transient bugs out. Preserve
these fixes when replicating:

1. **Seed via the `values` prop**, not `reset()` in a `useEffect` — `reset` leaves
   `Controller`-bound fields stale.
2. **Detect "field changed" with `dirtyFields.x`**, not `useWatch` — `useWatch`
   lags one render and false-positives, clobbering the seeded value.
3. **A controlled Radix `Select` goes stale across cross-user SPA navigation**
   (the `useForm` instance persists). Fix: `key={user.id}` (remount per user) +
   `defaultValue={field.value}` (uncontrolled seed), not a controlled `value`.
4. **A disabled Radix `Select` doesn't render its value** → for the self-edit
   read-only case, show a Badge instead of a disabled Select.

---

## 7. API Mocking (MSW)

- **Browser worker** (`msw/browser`), registered in `src/api/mocks/index.ts`:
  `setupWorker(...handlers)`; `enableMSW()` starts it **only when
  `MODE === 'test'`** (`pnpm dev:test` and Playwright). In real `dev`/`build`,
  the worker is dormant and Axios hits `VITE_API_URL`.
- **Handler ordering matters.** Static routes must be registered before dynamic
  ones that would shadow them — e.g. `GET /users/verify-email` and
  `/users/confirm-email-change` are registered **before** `GET /users/:userId`,
  or the `:userId` param handler swallows them.
- **Mock state** lives in `*-data.ts` modules (`users`, `gyms`, `check-ins`) as
  **mutable arrays**, so an edit in one screen is visible in the next request —
  the mock behaves like a tiny stateful backend. Helpers mirror the backend's
  guards (`requireAdmin` → 401/403).
- **Fidelity rule:** a handler must reproduce the backend's **exact** status
  codes and `message` strings (e.g. `"E-mail already exists."`,
  `"You cannot change your own role."`). The mock is the contract the e2e suite
  asserts against, so drift here is a real bug.
- `onUnhandledRequest: 'bypass'` — unmocked requests pass through (e.g. static
  assets).

---

## 8. Styling & Components

- **Tailwind CSS v4**, configured **in CSS** (`global.css`), no
  `tailwind.config.js`. The entry imports Tailwind, `tw-animate-css`,
  `shadcn/tailwind.css` and the Geist font, declares
  `@custom-variant dark (&:is(.dark *))` (the v4 way to wire the `dark:` variant
  to a `.dark` class), and maps design tokens under `@theme inline`.
- **Theme** (`components/theme/`): `ThemeProvider` toggles `.dark` on `<html>`
  and persists the choice (`localStorage`, key `vite-ui-theme`); `mode-toggle`
  is the switcher. Tokens are CSS variables, so light/dark is one class flip.
- **shadcn/ui** (`components.json`: style `radix-nova`, base color `neutral`, CSS
  variables) generates components into `components/ui/`. Treat them as owned
  source you may tweak, but prefer regenerating over hand-editing structure.
- **`cn()`** (`lib/utils.ts`) = `clsx` + `tailwind-merge` for conditional,
  conflict-free class merging. Custom variant-driven components use
  `tailwind-variants` (`tv`) — see `components/ui-sample/button.tsx` (cascade
  tier 3).
- **Responsive data lists** (`components/responsive-list/`): `ResponsiveList`
  renders a shadcn `Table` on desktop (`≥ lg`) and a stack of cards below it.
  Both come from **one** `columns` config — each column declares a compact-mode
  `card` slot (`top` · `bottom` · `bottom-right` · `actions` · `hide`) and the
  card is built as `Label: value` fields. It renders only the active tree (via
  `useLayoutBand`), so per-row dialogs/links mount once. The four admin lists use
  it. `components/pager/` `Pager` is the shared pager (full mode = first/prev/
  next/last + "from–to of total"; simple mode = prev/next + "Page N"), used by the
  gym and user lists; its buttons widen on phones for easier tapping.

---

## 9. Tests

### 9.1 Unit / component (Vitest)

- Runner: Vitest + **happy-dom**, globals on, `setupFiles: test/setup.ts`
  (`@testing-library/jest-dom`). Glob: `src/**/*.spec.{ts,tsx}` — specs sit
  **next to the code**.
- `renderWithProviders` (`test/utils.tsx`) wraps the unit in a `MemoryRouter`
  (with an optional `route`) and a no-retry `QueryClient`.
- What's tested: PM logic, guard behavior (`role-route.spec`), page rendering and
  form rules (`*.spec.tsx`), pure lib functions (`check-in-activity.spec`).
- Coverage via `@vitest/coverage-v8` (`pnpm test:coverage`).

### 9.2 End-to-end (Playwright)

- Chromium project; specs in `test/*.spec.ts`; `baseURL: http://localhost:5001`.
- `webServer` auto-boots `pnpm dev:test` (MSW active in mode `test`) and reuses a
  running one locally. So **e2e runs entirely against the deterministic mock** —
  no backend, no network flakiness.
- `pretest:e2e` frees port 5001 first; `pnpm test:e2e:ui` runs headed/slow-mo.

### 9.3 The blind spot (why manual smoke still matters)

happy-dom renders Radix `Select`/`Switch` values eagerly (no lazy portal), and
Playwright's auto-wait can wait out a transient navigation bug. Bugs in the
**cold-load seeded value** of controlled fields can pass both suites and only
appear in a **real browser**. Lesson: assert the **seeded value** of controlled
fields, and smoke-test cross-entity navigation by hand. See §6.

---

## 10. Build & Tooling

- **Vite 8** (`vite.config.ts`): React plugin + Tailwind plugin; `@` → `src`
  alias; dev server on **3001**; the `test` block configures Vitest (happy-dom,
  coverage). `pnpm build` = `tsc -b` (type-check) then `vite build`.
- **TypeScript 6**, project references (`tsconfig.json` → `app`/`node`).
- **ESLint 10** flat config + `typescript-eslint`, `react-hooks`,
  `react-refresh`, `simple-import-sort`, `eslint-config-prettier`.
- **Prettier 3.8** (+ `prettier-plugin-curly`, `prettier-plugin-tailwindcss`);
  `pnpm check` / `pnpm format`.
- **Ports:** dev `3001`, mock/e2e `5001`, preview `4173`. `pnpm killapp` frees
  them.

---

## 11. Replicating a feature (step by step)

To add a screen backed by a new endpoint (e.g. "plans"):

1. **API client:** `src/api/get-plans.ts` — type the response, call `api.get`,
   map DTO → model.
2. **Mock:** `src/api/mocks/get-plans-mock.ts` mirroring the backend route
   (status codes + messages); add mock state in a `*-data.ts` if it mutates;
   register the handler in `mocks/index.ts` (mind ordering vs. dynamic routes).
3. **PM:** `src/pages/app/plans/use-plans-pm.ts` — `useQuery`/`useMutation`,
   derived values, handlers, any Zod form schema.
4. **View:** `src/pages/app/plans/plans.tsx` — pure markup consuming `pm`. Use
   the component cascade (§2.4); add a `PageTitle`.
5. **Route:** add it to `routes.tsx` under the right guard (`ProtectedRoute`,
   and `RoleRoute` if admin-only); add a sidebar entry if needed.
6. **Tests:** `plans.spec.tsx` (unit, `renderWithProviders`) and a
   `test/plans.spec.ts` e2e flow against the mock.
7. **Verify:** `pnpm lint && pnpm build && pnpm test:run && pnpm test:e2e`, then a
   manual browser smoke (§9.3).

> **Cross-cutting state?** If many screens need it, add a Context with the
> 3-file pattern (§2.3) — not a prop drilled through the tree, and not Query
> (Query is server state). If it's a reusable action, make a `src/hooks/use-x.ts`
> like `use-check-in`.

**Golden rule:** views never call Axios; PMs never build JSX; wire shapes never
leak past `src/api`. Build against the mock first; the real API is wired last.

---

## 12. Key Strengths (preserve these patterns)

- Mock-first: the UI and full test suite are green before the backend exists; the
  mock mirrors the contract verbatim.
- Strict view/logic split (Presentation Model) → readable views, testable logic.
- Context (3-file) for session/UI state; TanStack Query for server state — never
  mixed.
- Access token in memory only (anti-XSS); durability via the httpOnly refresh
  cookie; single-flight 401 refresh-and-replay.
- RBAC read fresh from `/me/permissions` (`can()` + `RequireScreen`); `Forbidden`
  rendered in place, not trusted from a token. Hybrid model: fixed role + dynamic
  profiles = membership + a curated per-screen permission catalog (friendly
  labels over free action keys — bare CRUD families or composed `family_name`) +
  a landing screen;
  the sidebar (membership) and landing screen are data-driven from the same
  payload, with a per-screen kill switch surfaced by `isScreenEnabled`.
- Typed `src/api` layer is the single place wire shapes (snake_case) map to app
  models (camelCase).
- Tailwind v4 (CSS-config) + shadcn cascade + token-based theming (one-class
  dark mode).
- Env validated on boot (fail-fast); two run modes from one codebase via Vite
  mode.
- Unit (happy-dom) + e2e (Playwright vs. MSW) suites — plus the documented
  manual-smoke discipline for controlled-field cold-load bugs.

## Internationalization (i18n)

Full UI internationalization, **frontend-only**, two languages: **en-US** (`en`)
and **pt-BR**. A flag selector in the header drives everything.

**Stack.** `react-i18next` + `i18next` + `i18next-browser-languagedetector`;
static JSON resources (no http-backend); typed keys via TS module augmentation
(`src/i18n/resources.d.ts`) so a missing/mistyped key is a **build error**.
`date-fns` (+ `@date-fns/tz`) for dates; `Intl.NumberFormat` is the documented
choice for numbers/money.

**Three independent concepts.** Keep them apart:
1. **Language** (which text) — from the selector, persisted in `localStorage`
   (`vite-ui-locale`), detected from `navigator` on first visit.
2. **Format locale** (date order, month names, 12/24h) — derived from the
   language (`enUS` / `ptBR` date-fns locales via `useLocale().dateLocale`).
3. **Timezone** (offset/DST) — from the **browser**
   (`Intl…resolvedOptions().timeZone`); dates render in local time. There is no
   stored per-user tz in v1; `@date-fns/tz` `TZDate` is installed + documented
   for that future override. A pt-BR user in Lisbon = `pt-BR` + `Europe/Lisbon`.

**Layout.** `src/i18n/` holds the init, the typed-keys augmentation, the
handwritten Zod locale maps (`zod-locale.ts`), and `locales/{en,pt-BR}/*.json`.
Namespaces: `common` (shared: actions, states, roles, status, errors, pager,
transfer, multiSelect, errorPage), `errors` (backend error codes → localized
text), `nav`, `catalog`, `auth`, `account`, `check-ins`, `gyms`, `admin`. `components/locale/` mirrors `components/theme/`
(provider + `useLocale` hook + `LanguageSelector`). `lib/datetime.ts` has the
date helpers. Changing the language syncs `<html lang>`, persists the choice, and
swaps the Zod locale.

**Conventions.**
- **One code everywhere** for a concept — never diverge the language tag across
  i18next / `<html lang>` / date-fns / Intl.
- **Interpolate, never concatenate** (word order differs per language); use
  `<Trans>` for embedded markup (e.g. the account email-change hint).
- **Validation messages** are built from a `factory(t)` memoized on
  `i18n.language`, so they follow the selector. Generic field rules live in
  `common:errors`; the Zod **locale map** (`z.config({ localeError })`) is the
  catch-all. **Precedence trap:** an inline schema message
  (`.min(3, 'msg')`) beats the locale map — so feature schemas pass `t()`
  messages, not inline strings.
- **Enum/status labels** are code→text maps (`common:roles`, `common:status`),
  never loose strings.
- **DB-sourced catalog** (sidebar module names, screen/action/profile names in
  chrome) is translated **by stable key** with the stored value as
  `defaultValue` fallback: `t('catalog:modules.<key>.name', { defaultValue:
  name })`. Seeded entries have a translation; admin-created rows fall back to
  their stored value (never machine-translated). In the **admin management
  tables** the raw stored name shows verbatim (it's the data being edited).
- **Numbers/money = data, not language.** This app has no money field; when one
  appears, format with `Intl.NumberFormat(localeTag, { style: 'currency',
  currency })` — not translation strings. (See `lib/datetime.ts` header.)

**Tests.** The `en` JSON values are verbatim the original English copy, so the
unit + e2e suites assert the same strings; `test/setup.ts` forces `lng: en` for
determinism. In dev, a `missingKeyHandler` warns on any unresolved key.

**Backend errors are localized.** The API serializes every failure as
`{ code, message, meta? }` with a **stable `snake_case` `code`** (the codes live
in `@root/contracts`). `messageFromError(err, fallback)` (`src/lib/errors.ts`)
maps `data.code` → `t('errors:' + code, { defaultValue: data.message ?? fallback,
...data.meta })`, so a server error resolves through the `errors` namespace (keys
=== codes verbatim, en + pt-BR), interpolating `meta` (`retryAfter`/`count`/
`action`); it falls back to the English `message`, then the caller's localized
`fallback`. The password-complexity hint is localized too
(`common:errors.passwordPattern`) — the `VITE_PASSWORD_PATTERN` regex stays
env-driven, but its message is no longer an env var. A literal-string eslint rule
(`eslint-plugin-i18next`) is a recommended future regression guard.
