import {
	createScreenBodySchema,
	type Screen,
	updateScreenBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import {
	permissions,
	profileScreens,
	screens,
} from './data/access-control-seed'
import { requireAuth } from './mock-auth'

let seq = 0
const nextId = () => `scr-new-${++seq}`

export const listScreensMock = http.get('/screens', ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const moduleId = new URL(request.url).searchParams.get('module_id')
	const result = moduleId
		? screens.filter((s) => s.module_id === moduleId)
		: screens
	return HttpResponse.json({ screens: result })
})

export const createScreenMock = http.post('/screens', async ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const parsed = createScreenBodySchema.safeParse(await request.json())
	if (!parsed.success) {
		return HttpResponse.json(
			{ code: 'validation_error', message: 'Validation error.' },
			{ status: 400 },
		)
	}

	// is_system is never client-settable; new screens start active + enabled with
	// an empty permission catalog (curate the ops afterwards in the editor).
	const screen: Screen = {
		id: nextId(),
		...parsed.data,
		is_system: false,
		is_active: true,
		is_enabled: true,
	}
	screens.push(screen)
	return HttpResponse.json({ screen }, { status: 201 })
})

export const updateScreenMock = http.patch<{ id: string }>(
	'/screens/:id',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const screen = screens.find((s) => s.id === params.id)
		if (!screen) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = updateScreenBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// A system screen's identity (key, module, path) is protected; only
		// name/description/order + the Active/On switches stay editable.
		if (screen.is_system) {
			const d = parsed.data
			const changesIdentity =
				(d.key !== undefined && d.key !== screen.key) ||
				(d.module_id !== undefined &&
					d.module_id !== screen.module_id) ||
				(d.path !== undefined && d.path !== screen.path)
			if (changesIdentity) {
				return HttpResponse.json(
					{
						code: 'system_screen',
						message:
							'A system screen cannot change its key, module or path.',
					},
					{ status: 409 },
				)
			}
		}

		Object.assign(screen, parsed.data)
		return HttpResponse.json({ screen })
	},
)

export const deleteScreenMock = http.delete<{ id: string }>(
	'/screens/:id',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const index = screens.findIndex((s) => s.id === params.id)
		if (index === -1) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// System screens are protected from deletion.
		if (screens[index].is_system) {
			return HttpResponse.json(
				{
					code: 'system_screen',
					message: 'A system screen cannot be deleted.',
				},
				{ status: 409 },
			)
		}

		// No cascade: a screen that's a member of profiles can't be deleted —
		// remove it from those profiles (or disable it) first.
		const assigned = Object.values(profileScreens).filter((ids) =>
			ids.includes(screens[index].id),
		).length
		if (assigned > 0) {
			return HttpResponse.json(
				{
					code: 'screen_in_use',
					message: `Assigned to ${assigned} profile(s). Remove it from those profiles first.`,
					meta: { count: assigned },
				},
				{ status: 409 },
			)
		}

		// Safe to delete: drop the screen and its own (ungranted) permissions.
		const [removed] = screens.splice(index, 1)
		for (let i = permissions.length - 1; i >= 0; i--) {
			if (permissions[i].screen_id === removed.id) {
				permissions.splice(i, 1)
			}
		}
		return new HttpResponse(null, { status: 204 })
	},
)
