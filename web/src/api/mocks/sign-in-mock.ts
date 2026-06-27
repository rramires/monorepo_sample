import { loginBodySchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import type { SignInBody } from '../sign-in'
import { tokenFor } from './mock-auth'
import { users } from './users-data'

export const signInMock = http.post<never, SignInBody>(
	'/auth/login',
	async ({ request }) => {
		// Validate the request body against the shared contract, like the backend.
		const parsed = loginBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}
		const { identifier, password } = parsed.data

		// Mock rule: the demo password authenticates any identifier. The identifier
		// resolves to a seeded user (by username or email) so signing in as
		// "admin", "manager" or "support" yields that user's token — and thus their
		// menu/guard. Unknown identifiers fall back to the default member.
		if (password === 'Password1!') {
			const user =
				users.find(
					(u) => u.username === identifier || u.email === identifier,
				) ?? users.find((u) => u.id === 'mock-user-id')
			return HttpResponse.json({ token: tokenFor(user!.id) })
		}

		return HttpResponse.json(
			{ code: 'invalid_credentials', message: 'Invalid credentials.' },
			{ status: 401 },
		)
	},
)
