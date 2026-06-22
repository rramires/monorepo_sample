import { loginBodySchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import type { SignInBody } from '../sign-in'

export const signInMock = http.post<never, SignInBody>(
	'/auth/login',
	async ({ request }) => {
		// Validate the request body against the shared contract, like the backend.
		const parsed = loginBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ message: 'Validation error.' },
				{ status: 400 },
			)
		}
		const { identifier, password } = parsed.data

		// Mock rule: the demo password authenticates any identifier. Signing in
		// as "admin" yields an admin token so you can reach role-gated screens.
		if (password === 'Password1!') {
			const token =
				identifier === 'admin'
					? 'mock-admin-jwt-token'
					: 'mock-jwt-token'
			return HttpResponse.json({ token })
		}

		return HttpResponse.json(
			{ message: 'Invalid credentials.' },
			{ status: 401 },
		)
	},
)
