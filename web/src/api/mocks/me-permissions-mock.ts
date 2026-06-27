import { mePermissionsSchema } from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { computePermissions, userIdFromToken } from './mock-auth'

export const mePermissionsMock = http.get('/me/permissions', ({ request }) => {
	const userId = userIdFromToken(request.headers.get('Authorization'))
	if (!userId) {
		return HttpResponse.json(
			{ code: 'unauthorized', message: 'Unauthorized.' },
			{ status: 401 },
		)
	}

	const permissions = computePermissions(userId)
	if (!permissions) {
		return HttpResponse.json(
			{ code: 'unauthorized', message: 'Unauthorized.' },
			{ status: 401 },
		)
	}

	// Parse through the shared DTO so the mock can't drift from the contract.
	return HttpResponse.json(mePermissionsSchema.parse(permissions))
})
