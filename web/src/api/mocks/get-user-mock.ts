import { http, HttpResponse } from 'msw'

import { requireAuth } from './mock-auth'
import { findUser } from './users-data'

export const getUserMock = http.get<{ userId: string }>(
	'/users/:userId',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const user = findUser(params.userId)
		if (!user) {
			return HttpResponse.json(
				{ message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		return HttpResponse.json({ user })
	},
)
