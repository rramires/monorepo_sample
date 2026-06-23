import { userResponseSchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { userIdFromToken } from './mock-auth'
import { findUser } from './users-data'
import { isVerified } from './verified-state'

export const profileMock = http.get('/auth/me', ({ request }) => {
	const userId = userIdFromToken(request.headers.get('Authorization'))
	const user = userId ? findUser(userId) : undefined

	if (!user) {
		return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
	}

	// Response is parsed through the shared contract DTO so any drift from the
	// backend's wire shape fails loudly here. The default member's verification
	// state is driven by the verify-email flow's in-memory toggle.
	const is_verified =
		user.id === 'mock-user-id' ? isVerified() : user.is_verified

	return HttpResponse.json(
		userResponseSchema.parse({
			user: {
				id: user.id,
				username: user.username,
				is_verified,
				role: user.role,
			},
		}),
	)
})
