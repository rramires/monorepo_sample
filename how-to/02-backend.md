# 02 — Backend (closes the contract)

Implements the real **Notices** API and swaps the mock for the real API, re-validating
the same screen. Do this **after** [`01-frontend`](./01-frontend.md) — the shared
contract (`@root/contracts/notices.ts`) already exists and is reused here.

**Branch for this part** (off `master` already with the front merged, or continue on
your line of work):

```sh
git checkout -b feat/notices-backend
```

House layers: **route → controller → use-case → repository (interface + impl)**,
wired by a **factory**. The controller doesn't talk to Prisma; the use-case doesn't
talk to HTTP. Analogous model: [`api/src/http/controllers/modules`](../api/src/http/controllers/modules/).

---

## Prerequisites — MySQL up

```sh
pnpm -C api compose:up      # starts MySQL (Docker)
# wait until it's healthy:
docker inspect --format '{{.State.Health.Status}}' monorepo_sample-solid_api_mysql-1
```

> ⚠️ **Gotcha — `.env` and health.** Database commands (`migrate`, `seeddb`) fail until
> the container is `healthy`, and require `api/.env` (with `DATABASE_URL`). If it's
> missing, `cp api/.env.example api/.env`. `.env` is gitignored — never commit a secret.

---

## Phase 1 — Prisma schema + migration + barrel

**Edit** `api/prisma/schema.prisma` — **at the end of the file** (after the last
`model`), add the model (`category` as `String`, validated by the contracts' Zod):

```prisma
model Notice {
  id         String   @id @default(uuid()) @db.VarChar(36)
  title      String   @db.VarChar(200)
  category   String   @db.VarChar(20)
  created_at DateTime @default(now())

  @@map("notices")
}
```

**Generate the migration + the client:**

```sh
pnpm -C api exec prisma migrate dev --name add_notices
pnpm -C api exec prisma generate
```

**Recreate the barrel** `api/src/prisma-client/index.ts` with exactly:

```ts
export * from './client.js'
```

> ⚠️ **Gotcha #1 (the biggest trap) — `prisma generate` DELETES the barrel.** `migrate
> dev` sometimes leaves the barrel intact, but the explicit `generate` removes it. Treat
> `migrate dev` + `generate` as a pair and **recreate the barrel right after**, or every
> `import { Notice } from '@/prisma-client'` breaks the build.

> ⚠️ **Gotcha #2 — `src/prisma-client/` is versioned (not gitignored).** That's why the
> `git add` in the Commit below includes the **whole generated folder** (not just
> `index.ts`), together with the schema and the migration — otherwise a clean checkout
> won't compile.


**Validation:**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/prisma/schema.prisma api/prisma/migrations/ api/src/prisma-client/
git commit -m "feat(notices): add Notice model + add_notices migration" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2 — Repository (interface + in-memory + prisma)

The dependency enters through an **interface**, with two implementations: in-memory
(unit tests) and Prisma (production).

In api/src/repositories/ **create** `i-notices-repository.ts`:

```ts
import { Notice } from '@/prisma-client'

// Partial edit: `undefined` = keep; provided fields overwrite.
export interface INoticeUpdateInput {
	title?: string
	category?: string
}

export interface INoticesRepository {
	list(): Promise<Notice[]>
	create(data: { title: string; category: string }): Promise<Notice>
	findById(id: string): Promise<Notice | null>
	update(id: string, data: INoticeUpdateInput): Promise<Notice>
	delete(id: string): Promise<void>
}
```

In `api/src/repositories/in-memory/` **create** `in-memory-notices-repository.ts`
(used in unit tests):

```ts
import { randomUUID } from 'node:crypto'

import { Notice } from '@/prisma-client'

import { INoticesRepository, INoticeUpdateInput } from '../i-notices-repository'

export class InMemoryNoticesRepository implements INoticesRepository {
	public items: Notice[] = []

	async list() {
		return this.items
	}

	async create(data: { title: string; category: string }) {
		// id + created_at are generated here (in real, Prisma does it via @default).
		const notice = {
			id: randomUUID(),
			title: data.title,
			category: data.category,
			created_at: new Date(),
		}
		this.items.push(notice)
		return notice
	}

	async findById(id: string) {
		return this.items.find((item) => item.id === id) ?? null
	}

	async update(id: string, data: INoticeUpdateInput) {
		// The use-case guarantees existence; changes only the provided fields.
		const notice = this.items.find((item) => item.id === id)
		if (!notice) {
			throw new Error('Notice not found')
		}
		if (data.title !== undefined) {
			notice.title = data.title
		}
		if (data.category !== undefined) {
			notice.category = data.category
		}
		return notice
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
	}
}
```

> ⚠️ **Gotcha — the in-memory generates `id` + `created_at` by hand.** Unlike Modules
> (no timestamp), `Notice` requires `created_at`; in the real repo Prisma resolves it via
> `@default(now())`/`@default(uuid())`, but in the in-memory you generate it
> (`randomUUID()` + `new Date()`) — otherwise you get a type error.

In `api/src/repositories/prisma/` **create** `prisma-notices-repository.ts`
(CRUD via `prisma.notice.*`; `list` orders by `created_at desc`):

```ts
import { prisma } from '@/lib/prisma'

import { INoticesRepository, INoticeUpdateInput } from '../i-notices-repository'

export class PrismaNoticesRepository implements INoticesRepository {
	async list() {
		const notices = await prisma.notice.findMany({
			orderBy: { created_at: 'desc' },
		})
		return notices
	}

	async create(data: { title: string; category: string }) {
		const notice = await prisma.notice.create({ data })
		return notice
	}

	async findById(id: string) {
		const notice = await prisma.notice.findUnique({ where: { id } })
		return notice
	}

	async update(id: string, data: INoticeUpdateInput) {
		// Existence is guaranteed by the use-case (findById first); `undefined` keys
		// are ignored by Prisma, so only the provided fields change.
		const notice = await prisma.notice.update({ where: { id }, data })
		return notice
	}

	async delete(id: string) {
		await prisma.notice.delete({ where: { id } })
	}
}
```

**Validation:**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/src/repositories/i-notices-repository.ts \
  api/src/repositories/in-memory/in-memory-notices-repository.ts \
  api/src/repositories/prisma/prisma-notices-repository.ts
git commit -m "feat(notices): notices repository (interface + in-memory + prisma)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3 — Use-case + factory + unit test

In api/src/use-cases/ **create** `notices-use-case.ts` — pure business logic; `update`
and `remove` raise `ResourceNotFoundError` when `findById` fails (reuses the existing
class; **don't invent a new error code**):

```ts
import { CreateNoticeBody, UpdateNoticeBody } from '@root/contracts'

import { Notice } from '@/prisma-client'
import { INoticesRepository } from '@/repositories/i-notices-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

export class NoticesUseCase {
	constructor(private noticesRepository: INoticesRepository) {}

	async list(): Promise<Notice[]> {
		return this.noticesRepository.list()
	}

	async create(body: CreateNoticeBody): Promise<Notice> {
		return this.noticesRepository.create(body)
	}

	async update(id: string, body: UpdateNoticeBody): Promise<Notice> {
		const existing = await this.noticesRepository.findById(id)
		if (!existing) throw new ResourceNotFoundError()
		return this.noticesRepository.update(id, body)
	}

	async remove(id: string): Promise<void> {
		const existing = await this.noticesRepository.findById(id)
		if (!existing) throw new ResourceNotFoundError()
		await this.noticesRepository.delete(id)
	}
}
```

In `api/src/use-cases/factories/` **create** `make-notices-use-case.ts` (injects the
`PrismaNoticesRepository`):

```ts
import { PrismaNoticesRepository } from '@/repositories/prisma/prisma-notices-repository'

import { NoticesUseCase } from '../notices-use-case'

export function makeNoticesUseCase() {
	const noticesRepository = new PrismaNoticesRepository()
	const useCase = new NoticesUseCase(noticesRepository)
	return useCase
}
```

In `api/src/use-cases/` **create** the unit test `notices-use-case.spec.ts` (uses the
**in-memory**; covers create/list/update/remove + both 404s):

```ts
import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryNoticesRepository } from '@/repositories/in-memory/in-memory-notices-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { NoticesUseCase } from './notices-use-case'

let noticesRepository: InMemoryNoticesRepository
let sut: NoticesUseCase

describe('Notices Use Case', () => {
	beforeEach(() => {
		noticesRepository = new InMemoryNoticesRepository()
		sut = new NoticesUseCase(noticesRepository)
	})

	it('creates a notice (id + created_at generated)', async () => {
		const notice = await sut.create({
			title: 'Pool closed for maintenance',
			category: 'warning',
		})

		expect(notice.id).toEqual(expect.any(String))
		expect(notice.created_at).toBeInstanceOf(Date)
		expect(notice.title).toEqual('Pool closed for maintenance')
		expect(notice.category).toEqual('warning')
		expect(noticesRepository.items).toHaveLength(1)
	})

	it('lists notices', async () => {
		await sut.create({ title: 'A', category: 'info' })
		await sut.create({ title: 'B', category: 'urgent' })

		const notices = await sut.list()

		expect(notices).toHaveLength(2)
	})

	it('updates a notice (only provided fields change)', async () => {
		const created = await sut.create({ title: 'Old', category: 'info' })

		const updated = await sut.update(created.id, { title: 'New' })

		expect(updated.title).toEqual('New')
		expect(updated.category).toEqual('info')
	})

	it('throws ResourceNotFoundError updating a missing notice', async () => {
		await expect(
			sut.update('does-not-exist', { title: 'X' }),
		).rejects.toBeInstanceOf(ResourceNotFoundError)
	})

	it('removes a notice', async () => {
		const created = await sut.create({ title: 'Bye', category: 'info' })

		await sut.remove(created.id)

		expect(noticesRepository.items).toHaveLength(0)
	})

	it('throws ResourceNotFoundError removing a missing notice', async () => {
		await expect(sut.remove('does-not-exist')).rejects.toBeInstanceOf(
			ResourceNotFoundError,
		)
	})
})
```

**Validation** (should raise the unit count, e.g. 119 → 125):

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/src/use-cases/notices-use-case.ts \
  api/src/use-cases/factories/make-notices-use-case.ts \
  api/src/use-cases/notices-use-case.spec.ts
git commit -m "feat(notices): NoticesUseCase + factory + unit spec" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4 — Controllers + routes + registration

One controller per verb. The controller `parse`s the body with the **shared schema**
and responds `reply.send({ notice })` / `{ notices }`.

The controllers live in a **new folder** — create it first:

```sh
mkdir -p api/src/http/controllers/notices
```

Create the four in that folder, one per verb (CRUD order):

`list-controller.ts`:

```ts
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const noticesUseCase = makeNoticesUseCase()
	const notices = await noticesUseCase.list()

	return reply.send({
		notices,
	})
}
```

`create-controller.ts`:

```ts
import { createNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const body = createNoticeBodySchema.parse(request.body)

	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.create(body)

	return reply.status(201).send({
		notice,
	})
}
```

`update-controller.ts` (validates the `noticeId` param with `z.uuid()`):

```ts
import { updateNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		noticeId: z.uuid(),
	})
	const { noticeId } = paramsSchema.parse(request.params)

	const body = updateNoticeBodySchema.parse(request.body)

	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.update(noticeId, body)

	return reply.send({
		notice,
	})
}
```

`delete-controller.ts`:

```ts
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		noticeId: z.uuid(),
	})
	const { noticeId } = paramsSchema.parse(request.params)

	const noticesUseCase = makeNoticesUseCase()
	await noticesUseCase.remove(noticeId)

	return reply.status(204).send()
}
```

In the same folder **create** `routes.ts` — an auth hook on the group +
`requireScreen('notices.notices', action)` per route:

```ts
import { FastifyInstance } from 'fastify'
import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'
import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { listController } from './list-controller'
import { updateController } from './update-controller'

export async function noticesRoutes(app: FastifyInstance) {
	app.addHook('onRequest', verifyJwtMiddleware)
	app.get('/notices', { onRequest: [requireScreen('notices.notices', 'view')] }, listController)
	app.post('/notices', { onRequest: [requireScreen('notices.notices', 'create')] }, createController)
	app.patch('/notices/:noticeId', { onRequest: [requireScreen('notices.notices', 'edit')] }, updateController)
	app.delete('/notices/:noticeId', { onRequest: [requireScreen('notices.notices', 'delete')] }, deleteController)
}
```

**Register** the routes in `api/src/app.ts`:

```ts
// add the import (simple-import-sort reorders):
import { noticesRoutes } from './http/controllers/notices/routes'
// and register it alongside the other app.register(...):
app.register(noticesRoutes)
```

> ⚠️ **Gotcha — `:noticeId` param.** It matches the front mock. Copying `:id`/`params.id`
> from Modules produces a silent `undefined`.

**Validation:**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```
**Commit:**

```sh
git add api/src/http/controllers/notices/list-controller.ts \
  api/src/http/controllers/notices/create-controller.ts \
  api/src/http/controllers/notices/update-controller.ts \
  api/src/http/controllers/notices/delete-controller.ts \
  api/src/http/controllers/notices/routes.ts api/src/app.ts
git commit -m "feat(notices): notices controllers + routes + app register" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 5 — Routes e2e test

In api/src/http/controllers/notices/ **create** `routes.spec.ts`. Authenticates as
**ADMIN** via `createAndAuthUser(app, true)` and covers create/list/update/delete + 404
(`resource_not_found`) + 400 (`validation_error` on an invalid category).

```ts
import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Notices routes (e2e)', () => {
	// Authenticate once as ADMIN (the `true` creates+authenticates an admin; ADMIN
	// bypasses requireScreen, so the routes respond without a seed grant). A fixed-
	// credential helper would give 409 on a 2nd call — share the token.
	let token: string

	beforeAll(async () => {
		await app.ready()
		token = (await createAndAuthUser(app, true)).token
	})

	afterAll(async () => {
		await app.close()
	})

	it('should be able to create, list, update and delete a notice', async () => {
		// create
		const createResponse = await request(app.server)
			.post('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Pool closed for maintenance', category: 'warning' })

		expect(createResponse.statusCode).toEqual(201)
		expect(createResponse.body.notice).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				title: 'Pool closed for maintenance',
				category: 'warning',
				created_at: expect.any(String),
			}),
		)
		const noticeId = createResponse.body.notice.id

		// list
		const listResponse = await request(app.server)
			.get('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(listResponse.statusCode).toEqual(200)
		expect(Array.isArray(listResponse.body.notices)).toBe(true)

		// update
		const updateResponse = await request(app.server)
			.patch(`/notices/${noticeId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Pool reopened', category: 'info' })

		expect(updateResponse.statusCode).toEqual(200)
		expect(updateResponse.body.notice.title).toEqual('Pool reopened')
		expect(updateResponse.body.notice.category).toEqual('info')

		// delete
		const deleteResponse = await request(app.server)
			.delete(`/notices/${noticeId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(deleteResponse.statusCode).toEqual(204)
	})

	it('returns 404 updating a non-existent notice', async () => {
		const response = await request(app.server)
			.patch(`/notices/${randomUUID()}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Nope' })

		expect(response.statusCode).toEqual(404)
		expect(response.body.code).toEqual('resource_not_found')
	})

	it('returns 404 deleting a non-existent notice', async () => {
		const response = await request(app.server)
			.delete(`/notices/${randomUUID()}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(404)
		expect(response.body.code).toEqual('resource_not_found')
	})

	it('rejects an invalid category at the body schema (400)', async () => {
		const response = await request(app.server)
			.post('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Bad', category: 'not-a-category' })

		expect(response.statusCode).toEqual(400)
		expect(response.body.code).toEqual('validation_error')
	})
})
```

> ⚠️ **Gotcha — ADMIN bypasses `requireScreen`.** The e2e uses an admin, and
> `GetUserPermissionsUseCase` short-circuits for the `ADMIN` role ("everything
> allowed"). So the routes respond **without any seed grant** — a green e2e does **not**
> prove the seed wiring (that's Phase 6).

**Validation (touches a route → e2e, MySQL up):**

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test && pnpm -C api test:e2e
```

**Commit:**

```sh
git add api/src/http/controllers/notices/routes.spec.ts
git commit -m "test(notices): e2e routes spec (admin CRUD + 404 + 400)" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 6 — Seed (so a real deploy shows the screen)

The real menu is built from `ProfileScreen` (membership) + grants. **Edit**
`api/prisma/seed.ts` in **four arrays** (all of them must agree).

In the `MODULES` array:

```ts
{ key: 'notices', name: 'Notices', description: 'Notice board for members.', order: 3, is_system: false },
```

In the `SCREENS` array (**`path` is required** — the menu filter drops a screen with a
null `path`):

```ts
{ key: 'notices.notices', name: 'Notices', module: 'notices', path: '/notices', description: 'Notice board for members.', order: 1, is_system: false },
```

In the `PERMISSIONS` array:

```ts
{ screen: 'notices.notices', action: 'view', label: 'View' },
{ screen: 'notices.notices', action: 'create', label: 'Add' },
{ screen: 'notices.notices', action: 'edit', label: 'Edit' },
{ screen: 'notices.notices', action: 'delete', label: 'Remove' },
```

In `PROFILE_GRANTS`, grant to **non-admin** profiles (admin is a role, bypasses
everything) — e.g. `support` with full CRUD, `gym-member`/`gym-manager` with only `view`:

```ts
// on the support profile:
{ screen: 'notices.notices', ops: ['view', 'create', 'edit', 'delete'] },
// on the gym-member and gym-manager profiles:
{ screen: 'notices.notices', ops: ['view'] },
```

Apply and verify:

```sh
pnpm -C api seeddb
```

> ⚠️ **Gotcha — admin is a ROLE, not a profile.** There's no "admin profile" in the
> seed; the admin (role) bypasses everything. For a **non-admin** to see the screen, they
> need **membership** (`ProfileScreen`) + a `view` grant. That's why Phase 5 (admin e2e)
> doesn't exercise this — check the seed by running `seeddb` and looking at the rows.

**Validation** (the seed is data, doesn't touch a route → only the unit gate):

```sh
pnpm -C api lint:fix && pnpm -C api format && pnpm -C api compile && pnpm -C api test
```

**Commit:**

```sh
git add api/prisma/seed.ts
git commit -m "feat(notices): seed notices module + screen + permissions + grants" \
  -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 7 — Swap the mock for the real API and re-validate

Now the same front screen runs against the real backend.

```sh
pnpm -C api db:fresh     # recreates MySQL + migrate + seed (clean state)
pnpm -C api dev          # real API on :3333
pnpm -C web dev          # front in real mode (NOT dev:test) — talks to :3333
```

Sign in with a **seeded** user that has the Notices grant (from Phase 6) and redo the
smoke from [Phase 7 of the front](./01-frontend.md#phase-7--browser-smoke-mandatory):
loading/empty/error, **cold-load** of the Select on edit, create/edit/delete.

> ⚠️ **Gotcha — real-mode password ≠ mock.** The seeded demo users use `ADMIN_PASSWORD`
> from `api/.env` (e.g. `admin` `Admin@12345`), **not** the mock's `Password1!`. To see a
> non-admin (with a `view` grant), use the profile you granted in Phase 6 (e.g.
> `support`).

> The front client (`web/src/api/notices.ts`) and the mock already hit the same
> contract, so the swap should be transparent. Any divergence here signals an unfaithful
> mock — fix both together.

---

## End — docs + delivery

1. **Review the docs in both languages** for each app you touched:
   `api/README*.md` + `api/PROJECT*.md` (route table, models, env) and
   `web/README*.md` + `web/PROJECT*.md` (route/screen table, features). The
   `web/docs/TUTORIAL_*` are **frozen** — don't edit them.
2. **Stop and let the user** test in the browser and **authorize the merge**. Only then:

   ```sh
   git checkout master && git merge --no-ff feat/notices-backend
   ```
3. **Never push** — the user does that.

## Phase summary (back)

| Phase | Deliverable | Validation |
|------|---------|------|
| 1 | schema + migration + barrel | `lint+compile+test` |
| 2 | repository (interface + 2 impls) | `lint+compile+test` |
| 3 | use-case + factory + unit spec | `lint+compile+test` |
| 4 | controllers + routes + register | `lint+compile+test` |
| 5 | routes e2e | `+ test:e2e` |
| 6 | seed (module/screen/perms/grants) | `lint+compile+test` |
| 7 | swap mock→real + re-validate | manual smoke |
