import { userResponseSchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { findUser } from './users-data'
import { isVerified } from './verified-state'

export const profileMock = http.get('/auth/me', ({ request }) => {
	const auth = request.headers.get('Authorization')

	// The admin token identifies the seeded admin (already verified). Username is
	// read from the directory so a self-service rename (PATCH /auth/me) shows up.
	// Response is parsed through the shared contract DTO so any drift from the
	// backend's wire shape fails loudly here.
	if (auth === 'Bearer mock-admin-jwt-token') {
		return HttpResponse.json(
			userResponseSchema.parse({
				user: {
					id: 'mock-admin-id',
					username: findUser('mock-admin-id')?.username ?? 'admin',
					is_verified: true,
					role: 'ADMIN',
				},
			}),
		)
	}

	// The demo access token identifies the seeded member.
	if (auth === 'Bearer mock-jwt-token') {
		return HttpResponse.json(
			userResponseSchema.parse({
				user: {
					id: 'mock-user-id',
					username: findUser('mock-user-id')?.username ?? 'johndoe',
					is_verified: isVerified(),
					role: 'USER',
				},
			}),
		)
	}

	return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
})
