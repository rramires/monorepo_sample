# 01 — Frontend (mock-first)

Constrói a feature **Notices** inteira no front, contra um **mock MSW**, até a tela
funcionar de ponta a ponta em `pnpm -C web dev:test`. Sem backend ainda. Leia o
[README](./README-pt-BR.md) primeiro (filosofia + workflow + checklist).

**Branch desta parte:**

```sh
git checkout -b feat/notices-frontend
```

Cada fase: o que criar → o **porquê** → a **validação** que prova. Commite ao final de
cada fase (validação verde antes). Stage estreito.

---

## Pré-requisitos

```sh
pnpm install                 # uma vez, na raiz do monorepo
pnpm -C web dev:test         # sobe a app em modo mock em http://localhost:5001
```

`dev:test` roda o Vite com `--mode test`, que liga o MSW (Mock Service Worker). É
nesse modo que você desenvolve e dá o smoke — nenhuma API real precisa estar de pé.

---

## Fase 1 — O contrato compartilhado

O formato do fio e o enum de categoria moram em `@root/contracts`, para que o
**form, o mock e o backend** validem contra a mesma fonte.

Na pasta packages/contracts/src/ **Crie** `notices.ts`:

```ts
import { z } from 'zod'

// `category` é um enum compartilhado: o Select do form, o mock e o backend
// validam todos contra a mesma fonte de verdade.
export const noticeCategorySchema = z.enum(['info', 'warning', 'urgent'])
export type NoticeCategory = z.infer<typeof noticeCategorySchema>

export const noticeSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	category: noticeCategorySchema,
	created_at: z.string(), // ISO; o Prisma serializa Date → string no JSON
})
export type Notice = z.infer<typeof noticeSchema>

// POST /notices — create.
export const createNoticeBodySchema = z.object({
	title: z.string().min(1),
	category: noticeCategorySchema,
})
export type CreateNoticeBody = z.infer<typeof createNoticeBodySchema>

// PATCH /notices/:noticeId — update; todo campo opcional.
export const updateNoticeBodySchema = createNoticeBodySchema.partial()
export type UpdateNoticeBody = z.infer<typeof updateNoticeBodySchema>
```

**Edite** o barrel `packages/contracts/src/index.ts` — adicione:

```ts
export * from './notices'
```

> **Por quê snake_case aqui?** O fio é `snake_case` (`created_at`) porque é o que o
> backend/Prisma fala. O front converte para `camelCase` na camada `src/api`
> (Fase 2). Modelo de referência: [`packages/contracts/src/modules.ts`](../packages/contracts/src/modules.ts).

**Validação:**

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

## Fase 2 — Cliente de API + mock MSW

### 2a. Cliente de API

Na pasta web/src/api/ **Crie** `notices.ts`. Aqui o `snake_case` vira `camelCase` e **não
vaza** dali pra frente. As respostas passam por `noticeSchema.parse(...)` para o
cliente não poder divergir do contrato.

```ts
import {
	type CreateNoticeBody,
	type NoticeCategory,
	noticeSchema,
	type UpdateNoticeBody,
} from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

// Modelo do app (camelCase). O wire (snake_case) não passa daqui.
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

Referência: [`web/src/api/search-gyms.ts`](../web/src/api/search-gyms.ts) (normalize),
[`web/src/api/modules.ts`](../web/src/api/modules.ts) (CRUD completo).

### 2b. Mock MSW (espelha o backend verbatim)

Na pasta web/src/api/mocks/ **Crie** `notices-mock.ts`. Espelhe **status + envelope de erro**
`{ code, message, meta? }`. `requireAuth` devolve 401 padronizado quando não há token.

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

**Registre** em `web/src/api/mocks/index.ts` — importe os quatro e adicione ao
`setupWorker(...)`. **Ordem importa:** as estáticas (`/notices`) antes das `:param`
(`/notices/:noticeId`):

```ts
// Junto aos outros imports de *-mock, adicione:
import {
	createNoticeMock,
	deleteNoticeMock,
	listNoticesMock,
	updateNoticeMock,
} from './notices-mock'
```

```ts
// No setupWorker(...), adicione os quatro (regra da casa: estáticas antes das
// :param — aqui os métodos diferem, então não morde, mas mantenha o hábito):
	listNoticesMock,
	createNoticeMock,
	updateNoticeMock,
	deleteNoticeMock,
```

> ⚠️ **Pegadinha — param name.** Use `:noticeId` (não `:id`) no mock **e** no backend
> depois; o cliente chama `/notices/${id}` com o id real, mas mock e back precisam
> bater no nome do param ou você lê `undefined`.

> ⚠️ **Pegadinha — fidelidade.** Cada `api/*.ts` tem que ter seu `mocks/*-mock.ts`.
> Mexeu num, mexe no outro. O envelope de erro é o mesmo do back: `{ code, message }`.

**Validação:**

```sh
pnpm -C web lint && pnpm -C web build && pnpm -C web test:run
```

**Commit:**

```sh
git add web/src/api/notices.ts web/src/api/mocks/notices-mock.ts web/src/api/mocks/index.ts
git commit -m "feat(web): notices API client + MSW mock" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 3 — i18n (namespace novo)

Texto de UI nunca é literal — tudo via `t()` em **en + pt-BR**. As chaves são
tipadas; chave faltando = erro de build.

Nas pastas web/src/i18n/locales/en/ e web/src/i18n/locales/pt-BR/ **Crie**
`notices.json` (mesmas chaves, valores por idioma). O
`en` é a fonte de verdade do shape:

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

E o `pt-BR/notices.json` (cole tal qual):

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

> ⚠️ **Pegadinha — o namespace é registrado em QUATRO lugares.** Esqueça um e o build
> quebra (chaves tipadas) ou a chave falha silenciosa em runtime.

**Edite** `web/src/i18n/index.ts` — adicione os imports do `notices` (o
`simple-import-sort` reordena sozinho; `enNav`/`ptBRNav` já existem):

```ts
import enNotices from './locales/en/notices.json'
import ptBRNotices from './locales/pt-BR/notices.json'
```

E ainda em `web/src/i18n/index.ts` — registre o namespace em `resources` (en +
pt-BR) e no array `ns:`. **A ordem não importa** em nenhum dos três:

```ts
// em export const resources no objeto .en:
notices: enNotices,
// em export const resources no objeto ['pt-BR']:
notices: ptBRNotices,
// no array ns (ns: [):
'notices',
```

**Edite** `web/src/i18n/resources.d.ts` — o import de tipo e o membro (ordem livre):

```ts
// adicione aos imports de tipo:
import type enNotices from './locales/en/notices.json'
// adicione no CustomTypeOptions em resources:
notices: typeof enNotices
```

**Validação:**

```sh
pnpm -C web lint && pnpm -C web build && pnpm -C web test:run
```
(o `build` é o que pega chave/typed faltando).
**Commit:**

```sh
git add web/src/i18n/locales/en/notices.json web/src/i18n/locales/pt-BR/notices.json \
  web/src/i18n/index.ts web/src/i18n/resources.d.ts
git commit -m "feat(web): notices i18n namespace" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 4 — Menu dinâmico + permissão (a parte mais esquecida)

O menu lateral **não é hardcoded** — ele é montado a partir de `/me/permissions`. No
modo mock, isso vem de uma **seed em memória**. Uma tela só aparece quando está
(1) na seed e concedida, **e** (2) registrada no `NAV_ENTRIES`.

### 4a. Seed do mock — `web/src/api/mocks/data/access-control-seed.ts`

Adicione **três coisas** (ordem livre; mirror das entradas existentes). **Não pule
esta fase** — sem ela o menu não mostra "Notices" (os gates passam mesmo assim).

Um **módulo** no array de módulos:

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

Uma **tela** no array de telas — **com `path`** (é o `path` que a torna um link):

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

Quatro **permissions** no `PERMISSION_SPECS` (repare a chave `screen_key`):

```ts
{ screen_key: 'notices.notices', action: 'view', label: 'View' },
{ screen_key: 'notices.notices', action: 'create', label: 'Add' },
{ screen_key: 'notices.notices', action: 'edit', label: 'Edit' },
{ screen_key: 'notices.notices', action: 'delete', label: 'Remove' },
```

> ⚠️ **Pegadinha — admin é ROLE, não perfil.** No mock, `computePermissions()` faz
> curto-circuito para `role === 'ADMIN'`: ele vê **toda tela que tem `path`** e
> carrega **toda permission**. Então, para o admin, basta adicionar a tela (com
> `path`) + as permissions — `can('notices.notices', ...)` já fica `true`. Você só
> precisa de um **grant de perfil** se um **não-admin** tiver que ver a tela. (O
> "membro não vê" sai de graça: nenhum perfil de membro lista a tela.)

> ⚠️ **Pegadinha — substring frágil em e2e.** Evite a palavra `gym` nas descrições da
> seed: há e2e existente (`web/test/access-control.spec.ts`) que filtra linhas por
> `hasText: 'gym'` e quebra se sua linha nova casar. Use algo como
> "Notice board for members."

### 4b. Registro de nav — `web/src/components/app-sidebar/use-app-sidebar-pm.ts`

Três adições (ordem livre em todas):

```ts
// 1) adicione Megaphone ao import de 'lucide-react':
Megaphone,
```

```ts
// 2) adicione à união NavLabelKey:
| 'notices'
```

```ts
// 3) adicione ao NAV_ENTRIES:
'notices.notices': { icon: Megaphone, labelKey: 'notices' },
```

### 4c. Labels i18n do menu

São entradas a **adicionar** em arquivos existentes (ponha a vírgula conforme a
posição entre os irmãos).

**`nav.json`** — rótulo curto do link, adicione a chave `notices`:

`web/src/i18n/locales/en/nav.json`:

```json
"notices": "Notices"
```

`web/src/i18n/locales/pt-BR/nav.json`:

```json
"notices": "Avisos"
```

**`catalog.json`** — nome do módulo/tela (o cabeçalho da seção do menu vem de
`catalog:modules.notices.name`). Adicione **uma entrada no objeto `modules` e outra
no objeto `screens`**:

`web/src/i18n/locales/en/catalog.json`:

```json
// Em 
"modules": {
	// Adicione:
	"notices": { "name": "Notices", "description": "Notice board for members." }
// Em
"screens": {
	// Adicione:
	"notices.notices": { "name": "Notices", "description": "Notice board for members." }
```

`web/src/i18n/locales/pt-BR/catalog.json`:

```json
// Em 
"modules": {
	// Adicione:
	"notices": { "name": "Avisos", "description": "Mural de avisos da academia." }
// Em
"screens": {
	// Adicione:
	"notices.notices": { "name": "Avisos", "description": "Mural de avisos da academia." }
```

> ⚠️ **Pegadinha — ordem rota × página.** A rota guardada (que importa a página
> `Notices`) entra **na Fase 5**, depois que a página existe. Se você adicionar a
> rota agora, o `build` desta fase quebra com
> `TS2307: Cannot find module './pages/app/notices/notices'`.

**Validação:**

```sh
pnpm -C web lint && pnpm -C web build && pnpm -C web test:run
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

## Fase 5 — Página + PM + diálogo (CRUD)

Tela única espelhando o CRUD de **Modules**: tabela `ResponsiveList` + botão "New
notice" (diálogo de criar) + ações por linha (editar via diálogo prefillado,
excluir via `ConfirmDialog`).

A página mora numa **pasta nova** — crie-a primeiro:

```sh
mkdir -p web/src/pages/app/notices
```

Todos os arquivos abaixo (5a–5d) ficam em `web/src/pages/app/notices/`.

### 5a. PM da página — `use-notices-pm.ts`

Server state via TanStack Query; formatação (data, label de categoria) e flags de
permissão moram aqui, para a view ficar pura:

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

### 5b. PM do diálogo — `use-notice-dialog-pm.ts`

O mesmo diálogo serve criar e editar. O schema vem de um `factory(t)` memoizado em
`i18n.language`. **A lição-âncora está no `onOpenChange`:** re-semear o form em toda
abertura, para a edição **cold-load** título + categoria.

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
		if (next) reset(defaults(notice)) // re-semeia → cold-load do Select na edição
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

> ⚠️ **Pegadinha — cold-load (a lição central).** Um `<Select>` Radix é controlado: sem
> re-semear o valor na abertura, ele abre **vazio** na edição e a validação falha
> "do nada". O `reset(defaults(notice))` no `onOpenChange` resolve. Os testes
> **asseguram o valor semeado** (Fase 6), não só a presença.

### 5c. View do diálogo — `notice-dialog.tsx`

View pura — o `category` é um `<Select>` via `Controller` (campo controlado),
espelhando [`screen-dialog.tsx`](../web/src/pages/app/admin/screens/screen-dialog.tsx).
Conteúdo de `notice-dialog.tsx`:

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

> ⚠️ **Pegadinha — a11y/testes.** Associe `<Label htmlFor>` ao `id` do input/trigger.
> O helper `Field` de modules/screens **não** faz isso, então `getByLabelText` não
> acha. Aqui o `<SelectTrigger id='category'>` + `<Label htmlFor='category'>`
> deixam o teste de cold-load funcionar.

### 5d. View da página — `notices.tsx`

View pura. Tabela via `ResponsiveList` (vira cards abaixo de `lg`), com colunas +
ações por linha (editar via `NoticeDialog`, excluir via `ConfirmDialog`), liberadas
por `pm.canEdit`/`pm.canDelete`, espelhando
[`modules.tsx`](../web/src/pages/app/admin/modules/modules.tsx). Conteúdo de
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
					// nota: a chave de interpolação aqui é {{title}} (não {{name}})
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

### 5e. Rota guardada — `web/src/routes.tsx`

Agora que a página existe, registre a rota guardada (espelha o `can()` do menu):

```tsx
// adicione o import (simple-import-sort reordena):
import { Notices } from './pages/app/notices/notices'
```

```tsx
// Entre os filhos do <AppLayout> (ex.: logo após o bloco da rota <RequireScreen screen='gym.check-ins' />),
// adicione:
{
	element: (
		<RequireScreen screen='notices.notices' />
	),
	children: [
		{ path: 'notices', element: <Notices /> },
	],
},
```

**Validação:**

```sh
pnpm -C web lint && pnpm -C web build && pnpm -C web test:run
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

## Fase 6 — Testes (unit/component + e2e)

### 6a. Component spec (cold-load!)

Na pasta `web/src/pages/app/notices/` **Crie** `notice-dialog.spec.tsx` e adicione:

```tsx
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'

import { createNotice, updateNotice } from '@/api/notices'
import { Button } from '@/components/ui/button'

import { renderWithProviders } from '../../../../test/utils'
import { NoticeDialog } from './notice-dialog'

// Stub na API pra asserir as chamadas sem rede/MSW.
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

		// O input de título carrega o valor da notícia.
		expect(await screen.findByLabelText('Title')).toHaveValue('Pool closed')
		// O Select (via Controller) tem que carregar a categoria armazenada na
		// abertura — a regressão-âncora de cold-load: vinha vazio e quebrava a validação.
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

Faz stub do
`@/api/notices`, abre o diálogo e **verifica o valor pré-preenchido** do título e do
Select na edição (a regressão de cold-load), o default `Info` num aviso novo, e que a
validação barra título vazio. Usa `renderWithProviders` de
[`web/test/utils.tsx`](../web/test/utils.tsx).

### 6b. E2E (Playwright)

Na pasta `web/test/` **Crie** `notices.spec.ts`. e adicione:

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

	// O link Notices está na sidebar (tela semeada + NAV_ENTRIES).
	await page.getByRole('link', { name: 'Notices' }).click()
	await expect(page).toHaveURL('/notices')

	// ── Create ──────────────────────────────────────────────────────────────
	await page.getByRole('button', { name: 'New notice' }).click()
	await page.getByLabel('Title').fill('Lockers being replaced')
	// Radix Select: abre o combobox e escolhe a opção.
	await page.getByRole('combobox').click()
	await page.getByRole('option', { name: 'Urgent' }).click()
	await page.getByRole('button', { name: 'Create notice' }).click()

	await expect(page.getByText('Notice created.')).toBeVisible()
	await expect(
		page.getByText('Lockers being replaced', { exact: true }),
	).toBeVisible()

	// ── Edit ──────────────────────────────────────────────────────────────────
	// Botões de linha são ícone-only (sem nome acessível): selecione posicional —
	// .first() = Editar (lápis), .nth(1) = Excluir (lixeira).
	const row = page
		.getByRole('row')
		.filter({ hasText: 'Lockers being replaced' })
	await row.getByRole('button').first().click()

	// Cold-load: o input de título carrega o valor armazenado na abertura.
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

	// johndoe é membro — sem membership em notices, logo sem link na sidebar.
	await expect(page.getByRole('link', { name: 'Notices' })).toHaveCount(0)

	await waitForUIInspection(page)
})
```

Fluxo real no browser mock: admin
entra, abre **Notices** pelo menu, **cria** (título + categoria via combobox),
**edita** (confere o cold-load do título) e **exclui**; e um **membro não vê** o
link. Senha de mock: `Password1!`; usuários `admin` e `johndoe` (membro).

> ⚠️ **Pegadinha — botões de ícone em e2e.** `getByRole('button', { name: /edit/i })`
> não acha um botão só-ícone (ele não tem texto). Use seletor posicional na linha
> (como acima) ou dê um `aria-label` ao botão.

**Validação (toca fluxo → roda e2e):**

```sh
pnpm -C web lint && pnpm -C web build && pnpm -C web test:run && pnpm -C web test:e2e
```

**Commit:**

```sh
git add web/src/pages/app/notices/notice-dialog.spec.tsx web/test/notices.spec.ts
git commit -m "test(web): notices component spec (cold-load) + e2e (admin CRUD + member gating)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Fase 7 — Smoke no browser (obrigatório)

Validações verdes não bastam: happy-dom e o auto-wait do Playwright escondem bugs de
cold-load de campo controlado. Exercite na mão:

```sh
pnpm -C web dev:test     # http://localhost:5001
```

Logue como **admin**, abra **Notices** e confira:

- **loading / empty / error** — a lista carrega; se esvaziar a seed do mock, mostra o
  empty; derrube o token e veja o erro tratado.
- **cold-load** — abra **Editar** numa linha: o título **e** a categoria têm que vir
  preenchidos com o valor real (o Select **não** pode abrir vazio).
- crie / edite / exclua e confira os toasts e a lista atualizando.

Logue como **membro** (`johndoe`) e confirme que **não há** link "Notices".

---

## Merge do front

Front completo, validado e smoked. Mescle no `master` (merge local — **só você dá
push**):

```sh
git checkout master
git merge --no-ff feat/notices-frontend
```

> A tela funciona inteira em mock. Agora feche o contrato no backend, a partir do
> `master` atualizado: siga **[`02-backend-pt-BR.md`](./02-backend-pt-BR.md)** (nova
> branch). O push pode ser agora ou só depois do backend — é seu.

---

## Resumo das fases (front)

| Fase | Entrega | Validação |
|------|---------|------|
| 1 | contrato `notices.ts` + barrel | `typecheck` |
| 2 | cliente API + mock MSW + registro | `lint+build+test:run` |
| 3 | namespace i18n (en+pt, 4 pontos) | `lint+build+test:run` |
| 4 | menu + permissão (seed mock, nav, labels) | `lint+build+test:run` |
| 5 | página + PM + diálogo + rota guardada | `lint+build+test:run` |
| 6 | testes component + e2e | `+ test:e2e` |
| 7 | smoke no browser (mock) | manual |
