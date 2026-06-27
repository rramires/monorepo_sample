import { http, HttpResponse } from 'msw'

import { userDefaultScreen } from './data/access-control-seed'
import { userIdFromToken } from './mock-auth'
import { findUser, users } from './users-data'
import { isVerified } from './verified-state'

interface UpdateProfileBody {
	username?: string
	default_screen_key?: string | null
}

export const updateProfileMock = http.patch<never, UpdateProfileBody>(
	'/auth/me',
	async ({ request }) => {
		const id = userIdFromToken(request.headers.get('Authorization'))
		const self = id ? findUser(id) : undefined
		if (!id || !self) {
			return HttpResponse.json(
				{ code: 'unauthorized', message: 'Unauthorized.' },
				{ status: 401 },
			)
		}

		const body = await request.json()

		if (body.username !== undefined) {
			const username = body.username.toLowerCase()
			// Username uniqueness across the directory (excluding self).
			if (
				users.some(
					(user) => user.username === username && user.id !== id,
				)
			) {
				return HttpResponse.json(
					{ code: 'email_already_exists', message: 'E-mail already exists.' },
					{ status: 409 },
				)
			}
			self.username = username
		}

		// Preferred landing screen (null clears it).
		if (body.default_screen_key !== undefined) {
			userDefaultScreen[id] = body.default_screen_key
		}

		return HttpResponse.json({
			user: {
				id,
				username: self.username,
				is_verified:
					id === 'mock-user-id' ? isVerified() : self.is_verified,
				role: self.role,
			},
		})
	},
)
