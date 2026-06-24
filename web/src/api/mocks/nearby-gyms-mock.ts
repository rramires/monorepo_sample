import { http, HttpResponse } from 'msw'

import { gyms } from './gyms-data'

// Mock simplification: every seeded gym counts as "nearby". The real backend
// filters by a ~10km radius. Like the backend, the member browse is active-only.
export const nearbyGymsMock = http.get('/gyms/nearby', () => {
	return HttpResponse.json({ gyms: gyms.filter((gym) => gym.is_active) })
})
