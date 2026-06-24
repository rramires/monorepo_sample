import {
	createProfileBodySchema,
	type Profile,
	profileDetailSchema,
	setProfileScreensBodySchema,
	updateProfileBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import {
	profiles,
	profileScreens,
	userProfiles,
} from './data/access-control-seed'
import { requireAuth } from './mock-auth'

let seq = 0
const nextId = () => `prof-new-${++seq}`

export const listProfilesMock = http.get('/profiles', ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}
	return HttpResponse.json({ profiles })
})

export const getProfileMock = http.get<{ id: string }>(
	'/profiles/:id',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const profile = profiles.find((p) => p.id === params.id)
		if (!profile) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// Detail carries the grants (feeds the TransferTable). Parsed through the
		// shared DTO so the mock can't drift from the contract.
		return HttpResponse.json(
			profileDetailSchema.parse({
				...profile,
				screens: profileScreens[profile.id] ?? [],
			}),
		)
	},
)

export const createProfileMock = http.post('/profiles', async ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const parsed = createProfileBodySchema.safeParse(await request.json())
	if (!parsed.success) {
		return HttpResponse.json(
			{ message: 'Validation error.' },
			{ status: 400 },
		)
	}

	// is_system is seed-only; user-created profiles are never system profiles.
	const profile: Profile = {
		id: nextId(),
		key: parsed.data.key,
		name: parsed.data.name,
		description: parsed.data.description,
		is_default: parsed.data.is_default,
		is_system: false,
	}
	profiles.push(profile)
	profileScreens[profile.id] = []
	// Single-default invariant: a new default demotes every other profile.
	if (profile.is_default) {
		for (const p of profiles) {
			if (p.id !== profile.id) {
				p.is_default = false
			}
		}
	}
	return HttpResponse.json({ profile }, { status: 201 })
})

export const updateProfileEntityMock = http.patch<{ id: string }>(
	'/profiles/:id',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const profile = profiles.find((p) => p.id === params.id)
		if (!profile) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = updateProfileBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// A system profile's key is protected; everything else stays editable.
		if (
			profile.is_system &&
			parsed.data.key !== undefined &&
			parsed.data.key !== profile.key
		) {
			return HttpResponse.json(
				{ message: 'A system profile key cannot be changed.' },
				{ status: 409 },
			)
		}

		// Single-default invariant: never leave zero defaults — turning the
		// current default off is rejected (promote another to move it).
		if (parsed.data.is_default === false && profile.is_default) {
			return HttpResponse.json(
				{ message: 'At least one profile must remain the default.' },
				{ status: 409 },
			)
		}

		Object.assign(profile, parsed.data)
		// Setting this profile as default demotes every other (radio).
		if (parsed.data.is_default === true) {
			for (const p of profiles) {
				if (p.id !== profile.id) {
					p.is_default = false
				}
			}
		}
		return HttpResponse.json({ profile })
	},
)

export const deleteProfileMock = http.delete<{ id: string }>(
	'/profiles/:id',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const profile = profiles.find((p) => p.id === params.id)
		if (!profile) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// System profiles are protected from deletion.
		if (profile.is_system) {
			return HttpResponse.json(
				{ message: 'A system profile cannot be deleted.' },
				{ status: 409 },
			)
		}

		profiles.splice(profiles.indexOf(profile), 1)
		delete profileScreens[profile.id]
		// Detach it from every user that held it.
		for (let i = userProfiles.length - 1; i >= 0; i--) {
			if (userProfiles[i].profile_id === profile.id) {
				userProfiles.splice(i, 1)
			}
		}
		return new HttpResponse(null, { status: 204 })
	},
)

export const setProfileScreensMock = http.put<{ id: string }>(
	'/profiles/:id/screens',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const profile = profiles.find((p) => p.id === params.id)
		if (!profile) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = setProfileScreensBodySchema.safeParse(
			await request.json(),
		)
		if (!parsed.success) {
			return HttpResponse.json(
				{ message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// Replace the grants wholesale — this is the TransferTable save.
		profileScreens[profile.id] = parsed.data.screens
		return HttpResponse.json(
			profileDetailSchema.parse({
				...profile,
				screens: profileScreens[profile.id],
			}),
		)
	},
)
