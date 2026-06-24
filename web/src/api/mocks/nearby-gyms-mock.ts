import { http, HttpResponse } from 'msw'

import { gyms } from './gyms-data'

// Mock simplification: every seeded gym counts as "nearby". The real backend
// filters by a ~10km radius. Active-only by default; managers (admin token) may
// include inactive — mirrors the backend gate.
export const nearbyGymsMock = http.get('/gyms/nearby', ({ request }) => {
	const isManager =
		request.headers.get('Authorization') === 'Bearer mock-admin-jwt-token'
	const includeInactive =
		isManager &&
		new URL(request.url).searchParams.get('includeInactive') === 'true'

	return HttpResponse.json({
		gyms: gyms.filter((gym) => includeInactive || gym.is_active),
	})
})
