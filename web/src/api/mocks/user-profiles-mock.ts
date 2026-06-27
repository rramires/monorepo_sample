import { assignUserProfilesBodySchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { profiles, userProfiles } from './data/access-control-seed'
import { requireAuth } from './mock-auth'
import { findUser } from './users-data'

export const getUserProfilesMock = http.get<{ id: string }>(
	'/users/:id/profiles',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		if (!findUser(params.id)) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const profile_ids = userProfiles
			.filter((up) => up.user_id === params.id)
			.map((up) => up.profile_id)
		return HttpResponse.json({ profile_ids })
	},
)

export const setUserProfilesMock = http.put<{ id: string }>(
	'/users/:id/profiles',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		if (!findUser(params.id)) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = assignUserProfilesBodySchema.safeParse(
			await request.json(),
		)
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// Ignore ids that don't resolve to a real profile, then replace the user's
		// assignments wholesale.
		const valid = parsed.data.profile_ids.filter((id) =>
			profiles.some((p) => p.id === id),
		)
		for (let i = userProfiles.length - 1; i >= 0; i--) {
			if (userProfiles[i].user_id === params.id) {
				userProfiles.splice(i, 1)
			}
		}
		for (const profile_id of valid) {
			userProfiles.push({ user_id: params.id, profile_id })
		}

		return HttpResponse.json({ profile_ids: valid })
	},
)
