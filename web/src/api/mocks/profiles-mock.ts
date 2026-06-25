import {
	createProfileBodySchema,
	type Profile,
	profileDetailSchema,
	type ProfileScreenGrant,
	setProfileGrantsBodySchema,
	updateProfileBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import {
	permissions,
	profileDefaultScreen,
	profilePermissions,
	profiles,
	profileScreens,
	userProfiles,
} from './data/access-control-seed'
import { requireAuth } from './mock-auth'

let seq = 0
const nextId = () => `prof-new-${++seq}`

// Build the wire detail (membership + per-screen granted permission ids +
// landing) from the three mutable seed maps.
function buildDetail(profile: Profile) {
	const memberScreenIds = profileScreens[profile.id] ?? []
	const granted = new Set(profilePermissions[profile.id] ?? [])
	const screensOut: ProfileScreenGrant[] = memberScreenIds.map(
		(screenId) => ({
			screen_id: screenId,
			permission_ids: permissions
				.filter((p) => p.screen_id === screenId && granted.has(p.id))
				.map((p) => p.id),
		}),
	)
	return profileDetailSchema.parse({
		...profile,
		default_screen_id: profileDefaultScreen[profile.id] ?? null,
		screens: screensOut,
	})
}

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

		return HttpResponse.json(buildDetail(profile))
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

	// is_system is seed-only; user-created profiles are never system profiles and
	// start active with no memberships/grants.
	const profile: Profile = {
		id: nextId(),
		key: parsed.data.key,
		name: parsed.data.name,
		description: parsed.data.description,
		is_default: parsed.data.is_default,
		is_system: false,
		is_active: true,
	}
	profiles.push(profile)
	profileScreens[profile.id] = []
	profilePermissions[profile.id] = []
	profileDefaultScreen[profile.id] = null
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

		// No cascade: a profile assigned to users can't be deleted — deactivate
		// it or unassign its users first.
		const assigned = userProfiles.filter(
			(up) => up.profile_id === profile.id,
		).length
		if (assigned > 0) {
			return HttpResponse.json(
				{
					message: `Assigned to ${assigned} user(s). Unassign it from those users first.`,
				},
				{ status: 409 },
			)
		}

		profiles.splice(profiles.indexOf(profile), 1)
		delete profileScreens[profile.id]
		delete profilePermissions[profile.id]
		delete profileDefaultScreen[profile.id]
		return new HttpResponse(null, { status: 204 })
	},
)

export const setProfileGrantsMock = http.put<{ id: string }>(
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

		const parsed = setProfileGrantsBodySchema.safeParse(
			await request.json(),
		)
		if (!parsed.success) {
			return HttpResponse.json(
				{ message: 'Validation error.' },
				{ status: 400 },
			)
		}

		const membership = parsed.data.screens.map((s) => s.screen_id)
		const grantedIds = parsed.data.screens.flatMap((s) => s.permission_ids)
		const landing = parsed.data.default_screen_id

		// The landing screen must be an assigned, viewable screen.
		if (landing !== null) {
			const viewPermId = permissions.find(
				(p) => p.screen_id === landing && p.action === 'view',
			)?.id
			const ok =
				membership.includes(landing) &&
				!!viewPermId &&
				grantedIds.includes(viewPermId)
			if (!ok) {
				return HttpResponse.json(
					{
						message:
							'The landing screen must be an assigned, viewable screen.',
					},
					{ status: 400 },
				)
			}
		}

		// Replace membership, grants and landing wholesale — the profile-detail save.
		profileScreens[profile.id] = membership
		profilePermissions[profile.id] = grantedIds
		profileDefaultScreen[profile.id] = landing
		return HttpResponse.json(buildDetail(profile))
	},
)
