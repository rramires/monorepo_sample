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
		return HttpResponse.json(
			{ code: 'validation_error', message: 'Validation error.' },
			{ status: 400 },
		)
	}

	// is_system is never client-settable; new modules start active.
	const module: Module = {
		id: nextId(),
		...parsed.data,
		is_system: false,
		is_active: true,
	}
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
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = updateModuleBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// A system module's key is protected; everything else stays editable.
		if (
			module.is_system &&
			parsed.data.key !== undefined &&
			parsed.data.key !== module.key
		) {
			return HttpResponse.json(
				{
					code: 'system_module',
					message: 'A system module key cannot be changed.',
				},
				{ status: 409 },
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
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// System modules are protected from deletion.
		if (modules[index].is_system) {
			return HttpResponse.json(
				{
					code: 'system_module',
					message: 'A system module cannot be deleted.',
				},
				{ status: 409 },
			)
		}

		// A module can't be deleted while it still owns screens (FK-like guard).
		if (screens.some((s) => s.module_id === params.id)) {
			return HttpResponse.json(
				{
					code: 'module_has_screens',
					message: 'Module still has screens.',
				},
				{ status: 409 },
			)
		}

		modules.splice(index, 1)
		return new HttpResponse(null, { status: 204 })
	},
)
