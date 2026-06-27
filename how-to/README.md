# HOW-TO — Add a new feature (full-stack, front-first)

Step-by-step guide to **add anything new** to this monorepo without forgetting a
step (tests, mocks, i18n, menu/permissions, contract, docs). Works for a **human**
as much as for an **AI** that **doesn't know the project** — even though each app
already ships a `README` / `PROJECT` / `CLAUDE`. The goal is to guide you through
the **correct workflow**, respecting every house pattern and separation of
concerns, so you never build anything off-pattern.

> **Minimum reading before you start:** this README (it orchestrates everything),
> then [`01-frontend.md`](./01-frontend.md) and [`02-backend.md`](./02-backend.md)
> in order. If you only touch the front, guide 01 already delivers a working screen
> in mock mode.

---

## Starting point (reproduce the tutorial)

The example feature **Notices** already lives in this repo — it's the **finished
result** of this guide (the living example). So on `master` the module **already
exists**; to **build it yourself** following the step-by-step, start from a state
**before** Notices, on the baseline branch:

```sh
git checkout how-to-base    # pre-Notices code + this guide (validated version)
git checkout -b my-notices-feature
```

Then follow [`01-frontend.md`](./01-frontend.md) → [`02-backend.md`](./02-backend.md).
When you're done, compare your result against the **finished solution** on `master`:

```sh
git diff how-to-base master -- web api packages
```

> **For the maintainer.** `how-to-base` is the **validated** state = pre-feature code
> + the current guide. If you change the guide, re-run the tutorial to validate it and
> **move the pointer** to a pre-feature commit with the updated `how-to/` layered on
> top (then `git push -f origin how-to-base`). `master` keeps the finished example +
> guide. (When in doubt about git, just ask.)

---

## Who it's for

- **Human new to the project** — follow the copy-paste commands in order; each step
  states the *why* and has a *validation* that proves it worked.
- **AI / agent** — treat each phase as an atomic task: implement, run the validation,
  **commit**, move on. Don't skip phases; don't invent patterns.

## The house philosophy (understand before you type)

1. **Front-first, mock-first.** You build the whole screen against an **MSW mock**
   and only then close the backend. The screen has to work end-to-end in
   `pnpm -C web dev:test` (mock mode, port 5001) **before** a real API exists.
2. **Contract-first.** The wire shape (request/response, in `snake_case`) and the
   shared enums live in [`@root/contracts`](../packages/contracts/) — a single source
   of truth that front and back both import. The front maps `snake_case` →
   `camelCase` inside `src/api` and **never lets the wire leak** into the rest of the app.
3. **Presentation Model (PM).** Every component with logic is a **pair**: `x.tsx`
   (pure view, JSX only) + `use-x-pm.ts` (state/data/formatting). The view **never**
   calls Axios; the PM **never** builds JSX.
4. **Server state = TanStack Query.** `useQuery`/`useMutation` + `invalidateQueries`,
   never `fetch` inside `useEffect` for server data.
5. **Dynamic RBAC.** The sidebar menu and route access come from the **user's
   permissions** (`/me/permissions`). A screen only becomes a link when (a) it is
   seeded and granted to a profile **and** (b) it is registered in the front's
   `NAV_ENTRIES`.
6. **Total i18n.** No literal text in JSX — everything via `t()` in `en` + `pt-BR`.
   Keys are **typed**: a missing key = build error.
7. **UI text in English; tutorial prose in pt-BR.** (These guides are in English —
   translated from the pt-BR pair; labels/toasts in code are English.)

## The example feature: "Notices" (notice board)

The guides build, from scratch, a **new `Notices` module** — a single-page CRUD
screen (table + create/edit dialog + delete confirm), with **two fields**:

| Field | Type | Why it's here (the lesson) |
|-------|------|------------------------------|
| `title` | text input | basic input + localized Zod validation |
| `category` | **controlled Radix Select**, shared enum in contracts | **cold-load** of a controlled field on edit (the anchor lesson of the smoke test) + single enum + i18n of the options |

Entity: `Notice { id, title, category('info'|'warning'|'urgent'), created_at }`.
Two fields cover almost everything a real feature needs, without overkill.

> Where to look for living references (already on `master`): the **Gyms** screen
> ([`web/src/pages/app/gyms`](../web/src/pages/app/gyms/)) is the list/form model;
> the **Modules** CRUD
> ([`web/src/pages/app/admin/modules`](../web/src/pages/app/admin/modules/)) is the
> single-page-with-dialog model. On the backend, **Modules**
> ([`api/src/http/controllers/modules`](../api/src/http/controllers/modules/)) is the
> analogous CRUD.

---

## The two guides (order)

1. **[`01-frontend.md`](./01-frontend.md) — front, mock-first.** Shared contract →
   API client + MSW mock → menu/permission wiring → i18n → page + PM + dialog →
   tests (unit + e2e) → browser smoke. At the end, the whole screen works in mock mode.
2. **[`02-backend.md`](./02-backend.md) — back, closes the contract.** Prisma
   migration → repository → use-case → controllers/routes → tests → seed → swap the
   mock for the **real API** and re-validate the same screen.

---

## Git workflow (this is part of the lesson too)

Work the way the project works — that way the guide already teaches the discipline to
the next dev/AI:

1. **Branch per larger part**, off `master`. E.g. `feat/notices-frontend`, then
   `feat/notices-backend`. **Never** commit code straight to `master`.
2. **Commit per phase.** Each coherent phase becomes a commit, created **right after
   its validation passes**. Stage narrowly (`git add <paths>`). Conventional Commits.
   Never leave a finished phase uncommitted; never mix different work.
3. **Validation green before every commit** (table below).
4. **When the part is done, STOP for the user.** They test in the browser (route/form
   changes) and **authorize the merge**; only then do the local merge
   (`git checkout master && git merge --no-ff <branch>`).
5. **Only the user pushes.** **Never** run `git push`. After the push, delete the
   local branch.

The commit message ends with:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Validations (run from the monorepo root)

| App | Validation (before every commit) |
|-----|------------------------------|
| `contracts` | `pnpm -C packages/contracts typecheck` |
| `web` | `pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run` — and `pnpm -C web test:e2e` when you touch a route/flow |
| `api` | `pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test` — and `pnpm -C api test:e2e` (MySQL up: `pnpm -C api compose:up`) when you touch a route/seed |

> **Why `lint:fix && format` (and not just `lint`)?** `lint:fix` applies the
> auto-fixes (e.g. `simple-import-sort` orders imports — plain `lint` **fails** with
> "Run autofix to sort these imports!"); `format` (Prettier) standardizes the style.
> That way the validation **already resolves** import order + formatting before the
> commit, and the CI gate (`lint`/`build`/`test`) passes clean. (If your editor runs
> ESLint + Prettier on save, it happens by itself.)
>
> The repo is **fully formatted**, so `pnpm -C web format` (Prettier over `src`) is
> safe — it only touches what you changed, without dragging unrelated files into your
> commit.

---

## Cross-cutting "don't forget" checklist

Cite/check it at every relevant point. The guides repeat this inline where it matters.

- **Mock fidelity.** Every `web/src/api/*.ts` has a `web/src/api/mocks/*-mock.ts`
  mirroring the backend **verbatim** (status, error envelope `{ code, message, meta? }`,
  pagination). Change both together. Mind the **handler order** in `mocks/index.ts`:
  **static** routes **before** `:param` ones.
- **Controlled fields (cold-load).** On `Select`/`Switch`/OTP (Radix), validate the
  **seeded value** on edit, not just its presence — re-seed it in the dialog's
  `onOpenChange`. happy-dom and Playwright's auto-wait **hide** this bug; the **manual
  browser smoke** catches it.
- **Env.** Every new `VITE_*` goes into `web/.env.example` (commented) **and** the Zod
  schema in `web/src/env.ts`. Every new back env goes into `api/.env.example` **and**
  the schema in `api/src/env/index.ts`. `VITE_*` is **public** (it ships in the bundle)
  — **never** a secret.
- **Architecture.** The view doesn't call Axios; the PM doesn't build JSX;
  `snake_case` doesn't leak out of `src/api` (map to `camelCase` there); server state
  via TanStack Query. On the back: the controller doesn't talk to Prisma; the use-case
  doesn't talk to HTTP; a dependency enters through an **interface** via a **factory**.
- **Contracts / single Zod.** Enums (categories, roles, statuses) and wire shapes in
  the shared package; the front maps **code → text**. Back errors arrive as a stable
  `code` and are translated by `messageFromError` on the front.
- **Docs in both languages.** Every doc change lands in `README.md` + `README-pt-BR.md`
  and `PROJECT.md` + `PROJECT-pt-BR.md`, kept consistent (route table, env, tree,
  features). The `web/docs/TUTORIAL_*` are a **frozen** build narrative — don't edit them.
- **UI text in English; prose in pt-BR.**
- **Commits:** Conventional Commits, one per phase, validation green first; **never push**
  (only the user). Respect each app's `CLAUDE.md`/`AGENTS.md`.

---

## How to use this guide (one-line summary)

Read this README → follow **01-frontend** until the screen runs in mock → follow
**02-backend** until you swap to real → review the docs in both languages → **stop and
let the user test and merge/push.**
