import { api } from '@/lib/api'
import type { Coordinates } from '@/lib/geolocation'

import { type Gym, normalizeGym } from './search-gyms'

interface NearbyGymsResponse {
	gyms: Gym[]
}

export async function getNearbyGyms(
	{ latitude, longitude }: Coordinates,
	includeInactive = false,
) {
	const response = await api.get<NearbyGymsResponse>('/gyms/nearby', {
		params: {
			latitude,
			longitude,
			...(includeInactive ? { includeInactive: true } : {}),
		},
	})

	return response.data.gyms.map(normalizeGym)
}
