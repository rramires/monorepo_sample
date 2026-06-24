import {
	createScreenBodySchema,
	type Screen,
	updateScreenBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { profileScreens, screens } from './data/access-control-seed'
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
			{ message: 'Validation error.' },
			{ status: 400 },
		)
	}

	// is_system is never client-settable; created screens are always false.
	const screen: Screen = { id: nextId(), ...parsed.data, is_system: false }
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
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = updateScreenBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// A system screen's key is protected; everything else stays editable.
		if (
			screen.is_system &&
			parsed.data.key !== undefined &&
			parsed.data.key !== screen.key
		) {
			return HttpResponse.json(
				{ message: 'A system screen key cannot be changed.' },
				{ status: 409 },
			)
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
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// System screens are protected from deletion.
		if (screens[index].is_system) {
			return HttpResponse.json(
				{ message: 'A system screen cannot be deleted.' },
				{ status: 409 },
			)
		}

		// Deleting a screen also drops any profile grants pointing at it.
		const [removed] = screens.splice(index, 1)
		for (const profileId of Object.keys(profileScreens)) {
			profileScreens[profileId] = profileScreens[profileId].filter(
				(g) => g.screen_id !== removed.id,
			)
		}
		return new HttpResponse(null, { status: 204 })
	},
)
