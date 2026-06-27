# 01 — Frontend (mock-first)

Builds the whole **Notices** feature on the front, against an **MSW mock**, until the
screen works end-to-end in `pnpm -C web dev:test`. No backend yet. Read the
[README](./README.md) first (philosophy + workflow + checklist).

**Branch for this part:**

```sh
git checkout -b feat/notices-frontend
```

Each phase: what to create → the **why** → the **validation** that proves it. Commit
at the end of each phase (validation green first). Stage narrowly.

---

## Prerequisites

```sh
pnpm install                 # once, at the monorepo root
pnpm -C web dev:test         # runs the app in mock mode at http://localhost:5001
```

`dev:test` runs Vite with `--mode test`, which turns on MSW (Mock Service Worker).
That's the mode you develop and smoke-test in — no real API needs to be up.

---

## Phase 1 — The shared contract

The wire shape and the category enum live in `@root/contracts`, so that the **form,
the mock and the backend** all validate against the same source.

In packages/contracts/src/ **create** `notices.ts`:

```ts
import { z } from 'zod'

// `category` is a shared enum: the form's Select, the mock and the backend
// all validate against the same source of truth.
export const noticeCategorySchema = z.enum(['info', 'warning', 'urgent'])
export type NoticeCategory = z.infer<typeof noticeCategorySchema>

export const noticeSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	category: noticeCategorySchema,
	created_at: z.string(), // ISO; Prisma serializes Date → string in JSON
})
export type Notice = z.infer<typeof noticeSchema>

// POST /notices — create.
export const createNoticeBodySchema = z.object({
	title: z.string().min(1),
	category: noticeCategorySchema,
})
export type CreateNoticeBody = z.infer<typeof createNoticeBodySchema>

// PATCH /notices/:noticeId — update; every field optional.
export const updateNoticeBodySchema = createNoticeBodySchema.partial()
export type UpdateNoticeBody = z.infer<typeof updateNoticeBodySchema>
```

**Edit** the barrel `packages/contracts/src/index.ts` — add:

```ts
export * from './notices'
```

> **Why snake_case here?** The wire is `snake_case` (`created_at`) because that's what
> the backend/Prisma speaks. The front converts to `camelCase` in the `src/api` layer
> (Phase 2). Reference model: [`packages/contracts/src/modules.ts`](../packages/contracts/src/modules.ts).

**Validation:**

```sh
pnpm -C packages/contracts typecheck
```

**Commit:**

```sh 
git add packages/contracts/src/notices.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): add notices schemas (category enum, notice, create/update bodies)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2 — API client + MSW mock

### 2a. API client

In web/src/api/ **create** `notices.ts`. This is where `snake_case` becomes
`camelCase` and **doesn't leak** past here. Responses go through
`noticeSchema.parse(...)` so the client can't drift from the contract.

```ts
import {
	type CreateNoticeBody,
	type NoticeCategory,
	noticeSchema,
	type UpdateNoticeBody,
} from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

// The app model (camelCase). The wire (snake_case) doesn't pass beyond here.
export interface NoticeModel {
	id: string
	title: string
	category: NoticeCategory
	createdAt: string
}

const listSchema = z.object({ notices: z.array(noticeSchema) })
const oneSchema = z.object({ notice: noticeSchema })

function toModel(n: z.infer<typeof noticeSchema>): NoticeModel {
	return { id: n.id, title: n.title, category: n.category, createdAt: n.created_at }
}

export async function listNotices(): Promise<NoticeModel[]> {
	const response = await api.get('/notices')
	return listSchema.parse(response.data).notices.map(toModel)
}

export async function createNotice(body: CreateNoticeBody): Promise<NoticeModel> {
	const response = await api.post('/notices', body)
	return toModel(oneSchema.parse(response.data).notice)
}

export async function updateNotice(id: string, body: UpdateNoticeBody): Promise<NoticeModel> {
	const response = await api.patch(`/notices/${id}`, body)
	return toModel(oneSchema.parse(response.data).notice)
}

export async function deleteNotice(id: string): Promise<void> {
	await api.delete(`/notices/${id}`)
}
```

Reference: [`web/src/api/search-gyms.ts`](../web/src/api/search-gyms.ts) (normalize),
[`web/src/api/modules.ts`](../web/src/api/modules.ts) (full CRUD).

### 2b. MSW mock (mirrors the backend verbatim)

In web/src/api/mocks/ **create** `notices-mock.ts`. Mirror **status + error envelope**
`{ code, message, meta? }`. `requireAuth` returns a standardized 401 when there's no token.

```ts
import { createNoticeBodySchema, type Notice, updateNoticeBodySchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { requireAuth } from './mock-auth'

const notices: Notice[] = [
	{ id: 'notice-1', title: 'Welcome to the new gym app', category: 'info', created_at: '2026-01-10T12:00:00.000Z' },
	{ id: 'notice-2', title: 'Pool closed for maintenance', category: 'warning', created_at: '2026-01-12T09:30:00.000Z' },
]
let seq = 0
const nextId = () => `notice-new-${++seq}`

export const listNoticesMock = http.get('/notices', ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) return denied
	return HttpResponse.json({ notices })
})

export const createNoticeMock = http.post('/notices', async ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) return denied
	const parsed = createNoticeBodySchema.safeParse(await request.json())
	if (!parsed.success) {
		return HttpResponse.json({ code: 'validation_error', message: 'Validation error.' }, { status: 400 })
	}
	const notice: Notice = { id: nextId(), ...parsed.data, created_at: new Date().toISOString() }
	notices.push(notice)
	return HttpResponse.json({ notice }, { status: 201 })
})

export const updateNoticeMock = http.patch<{ noticeId: string }>('/notices/:noticeId', async ({ request, params }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) return denied
	const notice = notices.find((n) => n.id === params.noticeId)
	if (!notice) return HttpResponse.json({ code: 'resource_not_found', message: 'Resource not found.' }, { status: 404 })
	const parsed = updateNoticeBodySchema.safeParse(await request.json())
	if (!parsed.success) {
		return HttpResponse.json({ code: 'validation_error', message: 'Validation error.' }, { status: 400 })
	}
	Object.assign(notice, parsed.data)
	return HttpResponse.json({ notice })
})

export const deleteNoticeMock = http.delete<{ noticeId: string }>('/notices/:noticeId', ({ request, params }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) return denied
	const index = notices.findIndex((n) => n.id === params.noticeId)
	if (index === -1) return HttpResponse.json({ code: 'resource_not_found', message: 'Resource not found.' }, { status: 404 })
	notices.splice(index, 1)
	return new HttpResponse(null, { status: 204 })
})
```

**Register** in `web/src/api/mocks/index.ts` — import the four and add them to
`setupWorker(...)`. **Order matters:** static routes (`/notices`) before `:param` ones
(`/notices/:noticeId`):

```ts
// Alongside the other *-mock imports, add:
import {
	createNoticeMock,
	deleteNoticeMock,
	listNoticesMock,
	updateNoticeMock,
} from './notices-mock'
```

```ts
// In setupWorker(...), add the four (house rule: static before :param — here the
// methods differ, so it won't bite, but keep the habit):
	listNoticesMock,
	createNoticeMock,
	updateNoticeMock,
	deleteNoticeMock,
```

> ⚠️ **Gotcha — param name.** Use `:noticeId` (not `:id`) in the mock **and** in the
> backend later; the client calls `/notices/${id}` with the real id, but mock and back
> must match the param name or you read `undefined`.

> ⚠️ **Gotcha — fidelity.** Every `api/*.ts` must have its `mocks/*-mock.ts`. Touch one,
> touch the other. The error envelope is the same as the back's: `{ code, message }`.

**Validation:**

```sh
pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run
```

**Commit:**

```sh
git add web/src/api/notices.ts web/src/api/mocks/notices-mock.ts web/src/api/mocks/index.ts
git commit -m "feat(web): notices API client + MSW mock" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3 — i18n (new namespace)

UI text is never a literal — everything via `t()` in **en + pt-BR**. Keys are typed;
a missing key = build error.

In web/src/i18n/locales/en/ and web/src/i18n/locales/pt-BR/ **create**
`notices.json` (same keys, per-language values). `en` is the source of truth for the shape:

```json
{
	"pageTitle": "Notices",
	"title": "Notices",
	"description": "Post notices to the gym notice board.",
	"new": "New notice",
	"empty": "No notices found.",
	"columns": { "title": "Title", "category": "Category", "created": "Created", "actions": "Actions" },
	"categories": { "info": "Info", "warning": "Warning", "urgent": "Urgent" },
	"fields": { "titleRequired": "Title is required.", "categoryRequired": "Category is required." },
	"delete": { "title": "Delete notice", "description": "Delete \"{{title}}\"? This can't be undone.", "confirmLabel": "Delete" },
	"dialog": {
		"editTitle": "Edit notice", "newTitle": "New notice",
		"description": "A notice appears on the gym notice board.",
		"titleLabel": "Title", "categoryLabel": "Category", "selectCategory": "Select a category",
		"save": "Save changes", "create": "Create notice"
	},
	"toast": { "created": "Notice created.", "updated": "Notice updated.", "deleted": "Notice deleted.", "saveError": "Could not save the notice.", "deleteError": "Could not delete the notice." }
}
```

And `pt-BR/notices.json` (paste as-is):

```json
{
	"pageTitle": "Avisos",
	"title": "Avisos",
	"description": "Publique avisos no mural da academia.",
	"new": "Novo aviso",
	"empty": "Nenhum aviso encontrado.",
	"columns": { "title": "Título", "category": "Categoria", "created": "Criado em", "actions": "Ações" },
	"categories": { "info": "Informação", "warning": "Atenção", "urgent": "Urgente" },
	"fields": { "titleRequired": "O título é obrigatório.", "categoryRequired": "A categoria é obrigatória." },
	"delete": { "title": "Excluir aviso", "description": "Excluir \"{{title}}\"? Esta ação não pode ser desfeita.", "confirmLabel": "Excluir" },
	"dialog": {
		"editTitle": "Editar aviso", "newTitle": "Novo aviso",
		"description": "Um aviso aparece no mural da academia.",
		"titleLabel": "Título", "categoryLabel": "Categoria", "selectCategory": "Selecione uma categoria",
		"save": "Salvar alterações", "create": "Criar aviso"
	},
	"toast": { "created": "Aviso criado.", "updated": "Aviso atualizado.", "deleted": "Aviso excluído.", "saveError": "Não foi possível salvar o aviso.", "deleteError": "Não foi possível excluir o aviso." }
}
```

> ⚠️ **Gotcha — the namespace is registered in FOUR places.** Miss one and the build
> breaks (typed keys) or the key fails silently at runtime.

**Edit** `web/src/i18n/index.ts` — add the `notices` imports (`simple-import-sort`
reorders them on its own; `enNav`/`ptBRNav` already exist):

```ts
import enNotices from './locales/en/notices.json'
import ptBRNotices from './locales/pt-BR/notices.json'
```

Still in `web/src/i18n/index.ts` — register the namespace in `resources` (en + pt-BR)
and in the `ns:` array. **Order doesn't matter** in any of the three:

```ts
// in export const resources, in the .en object:
notices: enNotices,
// in export const resources, in the ['pt-BR'] object:
notices: ptBRNotices,
// in the ns array (ns: [):
'notices',
```

**Edit** `web/src/i18n/resources.d.ts` — the type import and the member (order-free):

```ts
// add to the type imports:
import type enNotices from './locales/en/notices.json'
// add inside CustomTypeOptions, in resources:
notices: typeof enNotices
```

**Validation:**

```sh
pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run
```
(`build` is what catches a missing/typed key).
**Commit:**

```sh
git add web/src/i18n/locales/en/notices.json web/src/i18n/locales/pt-BR/notices.json \
  web/src/i18n/index.ts web/src/i18n/resources.d.ts
git commit -m "feat(web): notices i18n namespace" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4 — Dynamic menu + permission (the most forgotten part)

The sidebar menu is **not hardcoded** — it's built from `/me/permissions`. In mock
mode that comes from an **in-memory seed**. A screen only shows up when it is (1) in
the seed and granted, **and** (2) registered in `NAV_ENTRIES`.

### 4a. Mock seed — `web/src/api/mocks/data/access-control-seed.ts`

Add **three things** (order-free; mirror the existing entries). **Don't skip this
phase** — without it the menu won't show "Notices" (the gates pass anyway).

A **module** in the modules array:

```ts
{
	id: 'mod-notices',
	key: 'notices',
	name: 'Notices',
	description: 'Notice board for members.',
	order: 3,
	is_system: false,
	is_active: true,
},
```

A **screen** in the screens array — **with a `path`** (the `path` is what makes it a link):

```ts
{
	id: 'scr-notices',
	module_id: 'mod-notices',
	key: 'notices.notices',
	name: 'Notices',
	path: '/notices',
	description: 'Notice board for members.',
	order: 0,
	is_system: false,
	is_active: true,
	is_enabled: true,
},
```

Four **permissions** in `PERMISSION_SPECS` (note the `screen_key` key):

```ts
{ screen_key: 'notices.notices', action: 'view', label: 'View' },
{ screen_key: 'notices.notices', action: 'create', label: 'Add' },
{ screen_key: 'notices.notices', action: 'edit', label: 'Edit' },
{ screen_key: 'notices.notices', action: 'delete', label: 'Remove' },
```

> ⚠️ **Gotcha — admin is a ROLE, not a profile.** In the mock, `computePermissions()`
> short-circuits for `role === 'ADMIN'`: it sees **every screen that has a `path`** and
> loads **every permission**. So for the admin, just adding the screen (with `path`) +
> the permissions is enough — `can('notices.notices', ...)` is already `true`. You only
> need a **profile grant** if a **non-admin** has to see the screen. (The "member can't
> see it" comes for free: no member profile lists the screen.)

> ⚠️ **Gotcha — fragile substring in e2e.** Avoid the word `gym` in the seed
> descriptions: there's an existing e2e (`web/test/access-control.spec.ts`) that filters
> rows by `hasText: 'gym'` and breaks if your new row matches. Use something like
> "Notice board for members."

### 4b. Nav registration — `web/src/components/app-sidebar/use-app-sidebar-pm.ts`

Three additions (order-free in all):

```ts
// 1) add Megaphone to the 'lucide-react' import:
Megaphone,
```

```ts
// 2) add to the NavLabelKey union:
| 'notices'
```

```ts
// 3) add to NAV_ENTRIES:
'notices.notices': { icon: Megaphone, labelKey: 'notices' },
```

### 4c. Menu i18n labels

These are entries to **add** to existing files (place the comma per the position among
the siblings).

**`nav.json`** — the link's short label, add the `notices` key:

`web/src/i18n/locales/en/nav.json`:

```json
"notices": "Notices"
```

`web/src/i18n/locales/pt-BR/nav.json`:

```json
"notices": "Avisos"
```

**`catalog.json`** — the module/screen name (the menu section header comes from
`catalog:modules.notices.name`). Add **one entry in the `modules` object and another in
the `screens` object**:

`web/src/i18n/locales/en/catalog.json`:

```json
// In 
"modules": {
	// Add:
	"notices": { "name": "Notices", "description": "Notice board for members." }
// In
"screens": {
	// Add:
	"notices.notices": { "name": "Notices", "description": "Notice board for members." }
```

`web/src/i18n/locales/pt-BR/catalog.json`:

```json
// In 
"modules": {
	// Add:
	"notices": { "name": "Avisos", "description": "Mural de avisos da academia." }
// In
"screens": {
	// Add:
	"notices.notices": { "name": "Avisos", "description": "Mural de avisos da academia." }
```

> ⚠️ **Gotcha — route × page order.** The guarded route (which imports the `Notices`
> page) goes in **Phase 5**, after the page exists. If you add the route now, this
> phase's `build` breaks with
> `TS2307: Cannot find module './pages/app/notices/notices'`.

**Validation:**

```sh
pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run
```
**Commit:**

```sh
git add web/src/api/mocks/data/access-control-seed.ts \
  web/src/components/app-sidebar/use-app-sidebar-pm.ts \
  web/src/i18n/locales/en/nav.json web/src/i18n/locales/pt-BR/nav.json \
  web/src/i18n/locales/en/catalog.json web/src/i18n/locales/pt-BR/catalog.json
git commit -m "feat(web): notices menu + permission wiring (mock seed, nav, labels)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 5 — Page + PM + dialog (CRUD)

A single screen mirroring the **Modules** CRUD: a `ResponsiveList` table + a "New
notice" button (create dialog) + per-row actions (edit via a prefilled dialog, delete
via `ConfirmDialog`).

The page lives in a **new folder** — create it first:

```sh
mkdir -p web/src/pages/app/notices
```

All the files below (5a–5d) go in `web/src/pages/app/notices/`.

### 5a. Page PM — `use-notices-pm.ts`

Server state via TanStack Query; formatting (date, category label) and permission flags
live here, so the view stays pure:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { deleteNotice, listNotices } from '@/api/notices'
import { useLocale } from '@/components/locale/locale-hooks'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/datetime'
import { messageFromError } from '@/lib/errors'

export function useNoticesPM() {
	const queryClient = useQueryClient()
	const { t } = useTranslation('notices')
	const { dateLocale } = useLocale()
	const { can } = usePermissions()

	const { data: notices = [], isLoading } = useQuery({ queryKey: ['notices'], queryFn: listNotices })

	const remove = useMutation({
		mutationFn: deleteNotice,
		onSuccess: () => {
			toast.success(t('toast.deleted'))
			queryClient.invalidateQueries({ queryKey: ['notices'] })
		},
		onError: (err) => toast.error(messageFromError(err, t('toast.deleteError'))),
	})

	const rows = [...notices]
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map((n) => ({ id: n.id, title: n.title, category: n.category, categoryLabel: t(`categories.${n.category}`), created: formatDate(n.createdAt, dateLocale) }))

	return {
		notices: rows,
		isLoading,
		canCreate: can('notices.notices', 'create'),
		canEdit: can('notices.notices', 'edit'),
		canDelete: can('notices.notices', 'delete'),
		deleteNotice: (id: string) => remove.mutateAsync(id),
	}
}
```

### 5b. Dialog PM — `use-notice-dialog-pm.ts`

The same dialog serves create and edit. The schema comes from a `factory(t)` memoized
on `i18n.language`. **The anchor lesson is in `onOpenChange`:** re-seed the form on
every open, so edit **cold-loads** title + category.

```ts
import { zodResolver } from '@hookform/resolvers/zod'
import { type NoticeCategory } from '@root/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { createNotice, updateNotice } from '@/api/notices'
import { messageFromError } from '@/lib/errors'

export interface NoticeInput { id: string; title: string; category: NoticeCategory }

const CATEGORIES: NoticeCategory[] = ['info', 'warning', 'urgent']

const makeNoticeForm = (t: TFunction<'notices'>) =>
	z.object({
		title: z.string().min(1, t('fields.titleRequired')),
		category: z.enum(CATEGORIES, { message: t('fields.categoryRequired') }),
	})
type NoticeForm = z.infer<ReturnType<typeof makeNoticeForm>>

function defaults(notice?: NoticeInput): NoticeForm {
	return { title: notice?.title ?? '', category: notice?.category ?? 'info' }
}

export function useNoticeDialogPM(notice?: NoticeInput) {
	const queryClient = useQueryClient()
	const { t, i18n } = useTranslation('notices')
	const [open, setOpen] = useState(false)
	const editing = !!notice

	const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<NoticeForm>({
		resolver: useMemo(
			() => zodResolver(makeNoticeForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
		defaultValues: defaults(notice),
	})

	function onOpenChange(next: boolean) {
		if (next) reset(defaults(notice)) // re-seeds → cold-load of the Select on edit
		setOpen(next)
	}

	const categoryOptions = CATEGORIES.map((value) => ({ value, label: t(`categories.${value}`) }))

	const save = useMutation({
		mutationFn: (data: NoticeForm) =>
			editing
				? updateNotice(notice.id, { title: data.title, category: data.category })
				: createNotice({ title: data.title, category: data.category }),
		onSuccess: async () => {
			toast.success(editing ? t('toast.updated') : t('toast.created'))
			await queryClient.invalidateQueries({ queryKey: ['notices'] })
			setOpen(false)
		},
		onError: (err) => toast.error(messageFromError(err, t('toast.saveError'))),
	})

	return { open, onOpenChange, editing, register, control, errors, isSubmitting, categoryOptions, onSubmit: handleSubmit((d) => save.mutate(d)) }
}
```

> ⚠️ **Gotcha — cold-load (the central lesson).** A Radix `<Select>` is controlled:
> without re-seeding the value on open, it opens **empty** on edit and validation fails
> "out of nowhere". The `reset(defaults(notice))` in `onOpenChange` fixes it. The tests
> **assert the seeded value** (Phase 6), not just its presence.

### 5c. Dialog view — `notice-dialog.tsx`

Pure view — `category` is a `<Select>` via `Controller` (controlled field), mirroring
[`screen-dialog.tsx`](../web/src/pages/app/admin/screens/screen-dialog.tsx).
Contents of `notice-dialog.tsx`:

```tsx
import { type ReactNode } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { type NoticeInput, useNoticeDialogPM } from './use-notice-dialog-pm'

export function NoticeDialog({ notice, trigger }: { notice?: NoticeInput; trigger: ReactNode }) {
	const pm = useNoticeDialogPM(notice)
	const { t } = useTranslation('notices')

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{pm.editing ? t('dialog.editTitle') : t('dialog.newTitle')}</DialogTitle>
					<DialogDescription>{t('dialog.description')}</DialogDescription>
				</DialogHeader>
				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='title'>{t('dialog.titleLabel')}</Label>
							<Input id='title' {...pm.register('title')} />
							{pm.errors.title && <p className='text-destructive text-sm'>{pm.errors.title.message}</p>}
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='category'>{t('dialog.categoryLabel')}</Label>
							<Controller
								control={pm.control}
								name='category'
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger id='category'>
											<SelectValue placeholder={t('dialog.selectCategory')} />
										</SelectTrigger>
										<SelectContent>
											{pm.categoryOptions.map((o) => (
												<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{pm.errors.category && <p className='text-destructive text-sm'>{pm.errors.category.message}</p>}
						</div>
						<DialogFooter>
							<Button type='submit' disabled={pm.isSubmitting}>{pm.editing ? t('dialog.save') : t('dialog.create')}</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
```

> ⚠️ **Gotcha — a11y/tests.** Associate `<Label htmlFor>` with the input/trigger `id`.
> The `Field` helper from modules/screens does **not** do this, so `getByLabelText`
> won't find it. Here `<SelectTrigger id='category'>` + `<Label htmlFor='category'>`
> let the cold-load test work.

### 5d. Page view — `notices.tsx`

Pure view. Table via `ResponsiveList` (becomes cards below `lg`), with columns +
per-row actions (edit via `NoticeDialog`, delete via `ConfirmDialog`), gated by
`pm.canEdit`/`pm.canDelete`, mirroring
[`modules.tsx`](../web/src/pages/app/admin/modules/modules.tsx). Contents of
`notices.tsx`:

```tsx
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { NoticeDialog } from './notice-dialog'
import { useNoticesPM } from './use-notices-pm'

type NoticeRow = ReturnType<typeof useNoticesPM>['notices'][number]

export function Notices() {
	const pm = useNoticesPM()
	const { t } = useTranslation(['notices', 'common'])

	const actions = (notice: NoticeRow) => (
		<>
			{pm.canEdit && (
				<NoticeDialog
					notice={{ id: notice.id, title: notice.title, category: notice.category }}
					trigger={<Button variant='outline' size='sm' className='w-16 lg:w-auto'><Pencil /></Button>}
				/>
			)}
			{pm.canDelete && (
				<ConfirmDialog
					title={t('delete.title')}
					// note: the interpolation key here is {{title}} (not {{name}})
					description={t('delete.description', { title: notice.title })}
					confirmLabel={t('delete.confirmLabel')}
					onConfirm={() => pm.deleteNotice(notice.id)}
					trigger={<Button variant='outline' size='sm' className='w-16 lg:w-auto'><Trash2 /></Button>}
				/>
			)}
		</>
	)

	const columns: ResponsiveListColumn<NoticeRow>[] = [
		{ key: 'title', header: t('columns.title'), cell: (n) => n.title, className: 'font-medium', card: 'top' },
		{ key: 'category', header: t('columns.category'), cell: (n) => n.categoryLabel, card: 'bottom-right' },
		{ key: 'created', header: t('columns.created'), cell: (n) => n.created, className: 'text-muted-foreground', card: 'bottom' },
		{ key: 'actions', header: t('columns.actions'), cell: actions, className: 'space-x-2 text-right', headClassName: 'text-right', card: 'actions' },
	]

	return (
		<>
			<PageTitle title={t('pageTitle')} />
			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader title={t('title')} description={t('description')}>
					{pm.canCreate && (
						<NoticeDialog trigger={<Button size='sm'><Plus />{t('new')}</Button>} />
					)}
				</PageHeader>
				<Card>
					<CardContent>
						{pm.isLoading ? (
							<p className='text-muted-foreground text-sm'>{t('common:states.loading')}</p>
						) : (
							<ResponsiveList
								rows={pm.notices}
								columns={columns}
								getRowKey={(n) => String(n.id)}
								empty={<p className='text-muted-foreground text-sm'>{t('empty')}</p>}
							/>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}
```

### 5e. Guarded route — `web/src/routes.tsx`

Now that the page exists, register the guarded route (it mirrors the menu's `can()`):

```tsx
// add the import (simple-import-sort reorders):
import { Notices } from './pages/app/notices/notices'
```

```tsx
// Among the <AppLayout> children (e.g. right after the <RequireScreen screen='gym.check-ins' /> route block),
// add:
{
	element: (
		<RequireScreen screen='notices.notices' />
	),
	children: [
		{ path: 'notices', element: <Notices /> },
	],
},
```

**Validation:**

```sh
pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run
```
**Commit:**

```sh
git add web/src/pages/app/notices/notices.tsx web/src/pages/app/notices/use-notices-pm.ts \
  web/src/pages/app/notices/notice-dialog.tsx web/src/pages/app/notices/use-notice-dialog-pm.ts \
  web/src/routes.tsx
git commit -m "feat(web): notices page + dialog (PM pair) + guarded route" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 6 — Tests (unit/component + e2e)

### 6a. Component spec (cold-load!)

In `web/src/pages/app/notices/` **create** `notice-dialog.spec.tsx` and add:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'

import { createNotice, updateNotice } from '@/api/notices'
import { Button } from '@/components/ui/button'

import { renderWithProviders } from '../../../../test/utils'
import { NoticeDialog } from './notice-dialog'

// Stub the API to assert the calls without network/MSW.
vi.mock('@/api/notices', () => ({
	createNotice: vi.fn(async () => ({})),
	updateNotice: vi.fn(async () => ({})),
}))

beforeEach(() => {
	vi.clearAllMocks()
})

function renderDialog(props: Parameters<typeof NoticeDialog>[0]['notice']) {
	return renderWithProviders(
		<NoticeDialog notice={props} trigger={<Button>Open</Button>} />,
	)
}

describe('NoticeDialog', () => {
	it('cold-loads the stored title and category when editing', async () => {
		const user = userEvent.setup()
		renderDialog({ id: 'notice-1', title: 'Pool closed', category: 'warning' })

		await user.click(screen.getByRole('button', { name: 'Open' }))

		// The title input loads the notice's value.
		expect(await screen.findByLabelText('Title')).toHaveValue('Pool closed')
		// The Select (via Controller) must load the stored category on open — the
		// cold-load anchor regression: it used to come up empty and break validation.
		expect(screen.getByRole('combobox')).toHaveTextContent('Warning')
	})

	it('defaults a new notice to the Info category', async () => {
		const user = userEvent.setup()
		renderWithProviders(<NoticeDialog trigger={<Button>Open</Button>} />)

		await user.click(screen.getByRole('button', { name: 'Open' }))

		expect(await screen.findByLabelText('Title')).toHaveValue('')
		expect(screen.getByRole('combobox')).toHaveTextContent('Info')
	})

	it('requires a title before creating', async () => {
		const user = userEvent.setup()
		renderWithProviders(<NoticeDialog trigger={<Button>Open</Button>} />)

		await user.click(screen.getByRole('button', { name: 'Open' }))
		await user.click(screen.getByRole('button', { name: 'Create notice' }))

		expect(await screen.findByText('Title is required.')).toBeInTheDocument()
		expect(createNotice).not.toHaveBeenCalled()
	})

	it('saves an edit with the title and category', async () => {
		const user = userEvent.setup()
		renderDialog({ id: 'notice-1', title: 'Pool closed', category: 'info' })

		await user.click(screen.getByRole('button', { name: 'Open' }))

		const title = await screen.findByLabelText('Title')
		await user.clear(title)
		await user.type(title, 'Pool reopened')
		await user.click(screen.getByRole('button', { name: 'Save changes' }))

		await waitFor(() =>
			expect(updateNotice).toHaveBeenCalledWith('notice-1', {
				title: 'Pool reopened',
				category: 'info',
			}),
		)
	})
})
```

It stubs `@/api/notices`, opens the dialog and **checks the prefilled value** of the
title and the Select on edit (the cold-load regression), the `Info` default on a new
notice, and that validation blocks an empty title. It uses `renderWithProviders` from
[`web/test/utils.tsx`](../web/test/utils.tsx).

### 6b. E2E (Playwright)

In `web/test/` **create** `notices.spec.ts` and add:

```ts
import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('admin creates, edits and deletes a notice', async ({ page }) => {
	await signIn(page, 'admin')

	// The Notices link is in the sidebar (seeded screen + NAV_ENTRIES).
	await page.getByRole('link', { name: 'Notices' }).click()
	await expect(page).toHaveURL('/notices')

	// ── Create ──────────────────────────────────────────────────────────────
	await page.getByRole('button', { name: 'New notice' }).click()
	await page.getByLabel('Title').fill('Lockers being replaced')
	// Radix Select: open the combobox and pick the option.
	await page.getByRole('combobox').click()
	await page.getByRole('option', { name: 'Urgent' }).click()
	await page.getByRole('button', { name: 'Create notice' }).click()

	await expect(page.getByText('Notice created.')).toBeVisible()
	await expect(
		page.getByText('Lockers being replaced', { exact: true }),
	).toBeVisible()

	// ── Edit ──────────────────────────────────────────────────────────────────
	// Row buttons are icon-only (no accessible name): select positionally —
	// .first() = Edit (pencil), .nth(1) = Delete (trash).
	const row = page
		.getByRole('row')
		.filter({ hasText: 'Lockers being replaced' })
	await row.getByRole('button').first().click()

	// Cold-load: the title input loads the stored value on open.
	await expect(page.getByLabel('Title')).toHaveValue('Lockers being replaced')
	await page.getByLabel('Title').fill('Lockers replaced — done')
	await page.getByRole('button', { name: 'Save changes' }).click()

	await expect(page.getByText('Notice updated.')).toBeVisible()
	await expect(
		page.getByText('Lockers replaced — done', { exact: true }),
	).toBeVisible()

	// ── Delete ──────────────────────────────────────────────────────────────
	const updatedRow = page
		.getByRole('row')
		.filter({ hasText: 'Lockers replaced — done' })
	await updatedRow.getByRole('button').nth(1).click()
	await expect(
		page.getByText(/Delete "Lockers replaced — done"\?/),
	).toBeVisible()
	await page.getByRole('button', { name: 'Delete' }).click()

	await expect(page.getByText('Notice deleted.')).toBeVisible()
	await expect(
		page.getByText('Lockers replaced — done', { exact: true }),
	).toHaveCount(0)

	await waitForUIInspection(page)
})

test('a member does not see the Notices menu item', async ({ page }) => {
	await signIn(page, 'johndoe')

	// johndoe is a member — no membership in notices, so no link in the sidebar.
	await expect(page.getByRole('link', { name: 'Notices' })).toHaveCount(0)

	await waitForUIInspection(page)
})
```

A real flow in the mock browser: the admin signs in, opens **Notices** from the menu,
**creates** (title + category via combobox), **edits** (checks the title cold-load) and
**deletes**; and a **member doesn't see** the link. Mock password: `Password1!`; users
`admin` and `johndoe` (member).

> ⚠️ **Gotcha — icon buttons in e2e.** `getByRole('button', { name: /edit/i })` won't
> find an icon-only button (it has no text). Use a positional selector on the row (as
> above) or give the button an `aria-label`.

**Validation (touches a flow → run e2e):**

```sh
pnpm -C web lint:fix && pnpm -C web format && pnpm -C web build && pnpm -C web test:run && pnpm -C web test:e2e
```

**Commit:**

```sh
git add web/src/pages/app/notices/notice-dialog.spec.tsx web/test/notices.spec.ts
git commit -m "test(web): notices component spec (cold-load) + e2e (admin CRUD + member gating)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 7 — Browser smoke (mandatory)

Green validations aren't enough: happy-dom and Playwright's auto-wait hide cold-load
bugs in a controlled field. Exercise it by hand:

```sh
pnpm -C web dev:test     # http://localhost:5001
```

Sign in as **admin**, open **Notices** and check:

- **loading / empty / error** — the list loads; if you empty the mock seed, it shows
  the empty state; drop the token and see the handled error.
- **cold-load** — open **Edit** on a row: the title **and** the category must come
  prefilled with the real value (the Select **must not** open empty).
- create / edit / delete and check the toasts and the list updating.

Sign in as a **member** (`johndoe`) and confirm there's **no** "Notices" link.

---

## Front merge

Front complete, validated and smoked. Merge into `master` (local merge — **only you
push**):

```sh
git checkout master
git merge --no-ff feat/notices-frontend
```

> The whole screen works in mock. Now close the contract on the backend, off the
> updated `master`: follow **[`02-backend.md`](./02-backend.md)** (new branch). The push
> can happen now or only after the backend — it's yours to decide.

---

## Phase summary (front)

| Phase | Deliverable | Validation |
|------|---------|------|
| 1 | contract `notices.ts` + barrel | `typecheck` |
| 2 | API client + MSW mock + registration | `lint+build+test:run` |
| 3 | i18n namespace (en+pt, 4 points) | `lint+build+test:run` |
| 4 | menu + permission (mock seed, nav, labels) | `lint+build+test:run` |
| 5 | page + PM + dialog + guarded route | `lint+build+test:run` |
| 6 | component + e2e tests | `+ test:e2e` |
| 7 | browser smoke (mock) | manual |
