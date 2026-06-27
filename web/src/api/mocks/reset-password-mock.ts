import { http, HttpResponse } from 'msw'

import type { ResetPasswordBody } from '../reset-password'

export const resetPasswordMock = http.post<never, ResetPasswordBody>(
	'/users/reset-password',
	async ({ request }) => {
		const body = await request.json()
		const credential = 'token' in body ? body.token : body.code

		// Mock rule: the demo token/code resets successfully; anything else 400.
		if (credential === 'valid-token' || credential === '123456') {
			return new HttpResponse(null, { status: 204 })
		}

		return HttpResponse.json(
			{
				code: 'invalid_reset_token',
				message: 'Invalid or expired reset token.',
			},
			{ status: 400 },
		)
	},
)
