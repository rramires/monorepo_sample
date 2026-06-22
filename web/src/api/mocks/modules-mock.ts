import {
	createModuleBodySchema,
	type Module,
	updateModuleBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { modules, screens } from './data/access-control-seed'
import { requireAuth } from './mock-auth'

let seq = 0
const nextId = () => `mod-new-${++seq}`

export const listModulesMock = http.get('/modules', ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}
	return HttpResponse.json({ modules })
})

export const createModuleMock = http.post('/modules', async ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const parsed = createModuleBodySchema.safeParse(await request.json())
	if (!parsed.success) {
		return HttpResponse.json({ message: 'Validation error.' }, { status: 400 })
	}

	const module: Module = { id: nextId(), ...parsed.data }
	modules.push(module)
	return HttpResponse.json({ module }, { status: 201 })
})

export const updateModuleMock = http.patch<{ id: string }>(
	'/modules/:id',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const module = modules.find((m) => m.id === params.id)
		if (!module) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = updateModuleBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ message: 'Validation error.' },
				{ status: 400 },
			)
		}

		Object.assign(module, parsed.data)
		return HttpResponse.json({ module })
	},
)

export const deleteModuleMock = http.delete<{ id: string }>(
	'/modules/:id',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const index = modules.findIndex((m) => m.id === params.id)
		if (index === -1) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// A module can't be deleted while it still owns screens (FK-like guard).
		if (screens.some((s) => s.module_id === params.id)) {
			return HttpResponse.json(
				{ message: 'Module still has screens.' },
				{ status: 409 },
			)
		}

		modules.splice(index, 1)
		return new HttpResponse(null, { status: 204 })
	},
)
