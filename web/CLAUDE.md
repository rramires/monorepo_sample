# CLAUDE.md — How to work on this repo

Instructions for AI assistants (and humans) contributing to this frontend.
Architecture lives in [PROJECT.md](PROJECT.md) / [PROJECT-pt-BR.md](PROJECT-pt-BR.md);
this file is about **process**.

## Before you start — approval & planning

- **Do not execute, edit, or commit anything until the user explicitly says
  so.** Discuss first; act only on an explicit go-ahead.
- **Plan the layout/approach _with_ the user before writing.** Ask **one
  question at a time**, in pt-BR, **no multiple-choice boxes** — a short
  conversational question. Resolve every open doubt before touching code.
- This started as a hand-executed tutorial; that collaborative, step-by-step
  rhythm is the default — propose, get the go-ahead, then act.

## Golden workflow (every change) — local, no PR

This is a sample/reference project: keep it simple. Work on a **local branch**,
commit per phase, and let the user own the merge and the push.

1. **Local branch per task**, off `master`. **Never commit code directly to
   `master`** — always branch first. Branches stay local until the user pushes.
    - **Exception — docs-only changes** (`README*`, `PROJECT*`, `CLAUDE.md`,
      `TUTORIAL_*`, with **no code**) may be committed straight to `master`.
2. **Commit per phase / per section** — one coherent step per commit, created
   **right after its gate passes**. Stage narrowly: `git add src` (plus
   `package.json`/lockfile when a dependency was installed, plus the spec file
   when you added an e2e test). Conventional Commits. Never batch unrelated work;
   never leave a finished phase uncommitted.
3. **Gate before every commit** (must be green):
    ```sh
    pnpm lint && pnpm build && pnpm test:run
    ```
    Changes that touch a user flow / route also run the e2e suite:
    ```sh
    pnpm test:e2e
    ```
4. **When the task is done, STOP and wait for the user.** The user tests the
   branch in the browser and authorizes the merge; only then merge locally
   (`git checkout master && git merge <branch>`).
    - **Only the user pushes.** Never run `git push` (not even
      `--force-with-lease`). After the user pushes and confirms, delete the local
      branch.

## Commit messages

Conventional Commits matching the change: `feat(account): …`, `fix(forms): …`,
`test: …`, `docs: …`, `chore: …`. The README/PROJECT docs get their **own**
`docs:` commit, separate from code. End every commit with:

```
Co-Authored-By: Claude <noreply@anthropic.com>
```

## Frontend patterns (must follow — details in PROJECT.md)

- **Presentation Model:** a component with logic is a pair — `x.tsx` (pure view)
  and `use-x-pm.ts` (state/data/formatting). The view body is just
  `const pm = useXxxPM()` then `return` — **nothing** between them (no `useState`,
  hook, derived value or handler). Trivial components stay single-file. Keep the
  pair **flat — side by side in the same folder** (gold standard:
  `account/email-card.tsx` + `account/use-email-card-pm.ts`). A route-level page
  or a component with its own sub-tree gets a folder named after it
  (`auth/sign-in/`, `…/profile-detail/`) holding that same flat pair.
- **Context = 3 files:** `x-context.ts` + `x-provider.tsx` + `x-hooks.ts`. Use it
  for session/UI state (auth, theme, title) — **not** for server state.
- **Server state = TanStack Query** (`useQuery`/`useMutation` + invalidation),
  never hand-rolled fetch-in-effect for server data.
- **Deactivation (soft-delete) = confirm-on-save toggle:** an entity's active
  state is an **Active `Switch` inside its edit form** (never a separate button);
  on save, if Active went **ON → OFF**, `useConfirmDeactivate`
  (`hooks/use-confirm-deactivate.ts`) opens a controlled `ConfirmDialog` before
  committing — reactivating / other edits don't prompt. Reuse the hook (don't
  re-implement the check per form); `user-edit` is the reference. Details in
  `PROJECT.md` §6.
- **Component cascade:** shadcn/ui → Radix primitive + Tailwind → custom
  (Tailwind + `tailwind-variants`/`tailwind-merge`, see `ui-sample/`) → custom
  CSS in `global.css`. Never skip straight to custom CSS.
- **Mobile-first / responsive bands:** author Tailwind mobile-first.
  `useIsMobile()` (768) drives the sidebar Sheet; `useLayoutBand()` gives the
  three bands (mobile `<md` / tablet `md–lg` / desktop `≥lg`) for band-specific
  layout. Content is **compact below `lg`** — wide tables become cards via
  `ResponsiveList` (column `card` slots), multi-col forms collapse to one column.
  Use the shared `Pager` for paginated lists.
- **Tailwind v4:** config is **in CSS** (`global.css`) — there is **no**
  `tailwind.config.js`. The `dark:` variant needs
  `@custom-variant dark (&:is(.dark *))`. Packages are v4+ (`@tailwindcss/vite`,
  `tailwind-merge` v3, `tailwind-variants` v3).
- **React 19 typing:** use `React.SubmitEvent` (the old `FormEvent` is
  deprecated).
- **Keyboard / focus:** a screen meant for typing **focuses its first field on
  mount** (`autoFocus` on the first input; Radix dialogs do it for free).
  Secondary links go **after** the primary action in tab order (e.g. sign-in's
  "Forgot your password?" sits below the Sign in button). Details in `PROJECT.md`
  §6.
- **Zod 4:** the project is on `zod@^4` — the schema syntax differs from v3
  (some APIs / error-customization moved or were deprecated). Write v4 syntax and
  port deprecations when adapting older snippets.
- **Mock fidelity:** every `src/api/*.ts` has a matching
  `src/api/mocks/*-mock.ts` that mirrors the backend **verbatim** (status codes,
  the `{ code, message, meta? }` error envelope, pagination). Add/adjust both
  together; mind handler ordering
  in `mocks/index.ts` (static routes before dynamic `:param` ones).
- **Env:** every new `VITE_*` var goes to `.env.example` (with a comment) **and**
  to the Zod schema in `src/env.ts`. `VITE_*` is **public** (inlined into the
  bundle) — never a secret.

## UI text vs. prose language

- **User-visible text comes from i18n, never hardcoded.** The app is fully
  internationalized (en-US + pt-BR) — every label, button, toast, page title,
  placeholder and aria-label resolves through `t()` / `<Trans>`. No English (or
  Portuguese) literal in JSX. See **Internationalization** below + `PROJECT.md`.
- **Tutorial/explanatory prose is pt-BR** (the `TUTORIAL_*` guides, and your
  conversation with the user).

## Internationalization (i18n)

Two languages: **en-US** (`en`) + **pt-BR**. Architecture lives in `PROJECT.md`
§ Internationalization — this is the working rule. When you add or touch
user-facing text:

- **Add the key to the right namespace** under `src/i18n/locales/{en,pt-BR}/`
  (`common`, `errors`, `nav`, `catalog`, `auth`, `account`, `check-ins`, `gyms`,
  `admin`), in **both** languages. `en` value = the exact English copy (keeps the suites
  green); author the pt-BR yourself (Brazilian, not European). Keys are
  **typed** — a missing/wrong key fails `pnpm build`.
- **Read it with** `useTranslation('<ns>')` (or `['<ns>', 'common']` to reach
  `common:` keys). **Interpolate** values (`t('k', { name })`), don't
  concatenate; use `<Trans>` for embedded markup.
- **Form validation:** build the Zod schema from a `factory(t)` memoized on
  `i18n.language`; reuse `common:errors.*` for generic field rules; never leave
  an inline `.min(n, 'msg')` (it beats the locale map — the precedence trap).
- **Dates** go through `lib/datetime.ts` (date-fns + `useLocale().dateLocale`),
  never `Intl.DateTimeFormat(undefined, …)` and never a hardcoded format.
- **Enum/status** → `common:roles` / `common:status` maps. **DB catalog**
  (module/screen/action names in chrome) → `t('catalog:…', { defaultValue })`.
  **Never translate user data** (gym names, usernames, admin-typed names).
- **Backend errors:** the API returns a stable `code` per failure (`{ code,
  message, meta? }`, codes in `@root/contracts`). Localize them with
  `messageFromError(err, fallback)` (`src/lib/errors.ts`), which maps `code` →
  the `errors` namespace (interpolating `meta`) and falls back to the English
  `message`, then the caller's localized `fallback`. The password-complexity hint
  is `common:errors.passwordPattern` (the `VITE_PASSWORD_MESSAGE` env var is
  gone). Add new codes to the `errors` namespace in **both** languages.

## Tests

- **Unit/component:** Vitest + Testing Library (happy-dom), specs **next to the
  code** (`src/**/*.spec.{ts,tsx}`); use `renderWithProviders` (`test/utils.tsx`).
- **E2E:** Playwright (Chromium) in `test/*.spec.ts`, auto-booting `pnpm dev:test`
  (MSW mock) on `:5001`.
- **Assert the seeded value of controlled fields** (Radix `Select`/`Switch`,
  `input-otp`), not just their presence. happy-dom + Playwright auto-wait can
  hide cold-load seeding bugs — finish risky form work with a **manual browser
  smoke** (see PROJECT.md §6 / §9.3 and `TUTORIAL_10`).

## Docs — always both languages

A doc change is incomplete until it lands in **all four** files:
`README.md` + `README-pt-BR.md`, `PROJECT.md` + `PROJECT-pt-BR.md` (and
`CLAUDE.md` when process changes). Keep them coherent (routes/pages table, env
table, folder tree, features). `PROJECT*.md` = architecture reference;
`README*.md` = setup + usage + smoke. **Finish every task with a docs review:**
re-read README + PROJECT (both languages) and confirm they still match the code
you touched — renamed/moved files and new routes are the usual source of drift.

## New features / flows — final manual verification

Beyond green gates, exercise the change **in the browser**:

```sh
pnpm dev:test    # mock mode, http://localhost:5001 — deterministic walkthrough
pnpm dev         # real-API mode, needs solid_api_sample on :3333 (+ seeded admin)
```

A route-/form-touching change is only "done" after a manual smoke in both modes
(at least mock), watching loading/empty/error states and controlled-field cold
loads.

## Shared contract (`@root/contracts`)

Some request/response shapes are shared with `api/` via `@root/contracts` (a
workspace package). Build form schemas **from** the shared shape and keep UI
refinements local: the auth forms call `makePasswordSchema({ min, pattern,
message, minMessage, maxMessage })` with the `VITE_PASSWORD_*` `min`/`pattern` +
**localized** messages — the pattern message is `t('common:errors.passwordPattern')`
(no longer an env var) — then add `confirmPassword`. MSW mocks validate requests against the request schema
and `parse` responses through the response DTO (e.g. `userResponseSchema`) so they
can't drift. Read `../packages/contracts/README.md` before changing a shared
shape, and keep the same Zod major as `api/`.

## Architecture (quick reminder)

Views never call Axios; PMs never build JSX; wire shapes (snake_case) never leak
past `src/api` (mapped to camelCase models there). Build against the MSW mock
first — the real API is wired last. The access token is in memory only; the
httpOnly refresh cookie owns durability. Full details in `PROJECT.md`.
