import { http, HttpResponse } from 'msw'

import { requireAuth } from './mock-auth'
import { users } from './users-data'

const PAGE_SIZE = 20

export const getUsersMock = http.get('/users', ({ request }) => {
	// Any authenticated user may reach the directory; the access-control.users
	// grant is enforced on the frontend (and on the backend later). The mock
	// keeps it open so manager/support can load the list.
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const url = new URL(request.url)
	const page = Number(url.searchParams.get('page') ?? '1')
	const start = (page - 1) * PAGE_SIZE

	return HttpResponse.json({ users: users.slice(start, start + PAGE_SIZE) })
})
