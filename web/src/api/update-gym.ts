import { api } from '@/lib/api'

import { type Gym, normalizeGym } from './search-gyms'

// Admin edit. latitude/longitude are fixed at creation, so they are not part of
// the update. `is_active` toggles the soft-delete (deactivate / reactivate).
export interface UpdateGymBody {
	title?: string
	description?: string | null
	phone?: string | null
	is_active?: boolean
}

interface UpdateGymResponse {
	gym: Gym
}

export async function updateGym(gymId: string, body: UpdateGymBody) {
	const response = await api.patch<UpdateGymResponse>(`/gyms/${gymId}`, body)

	return normalizeGym(response.data.gym)
}
