import { api } from '@/lib/api'

export interface Gym {
	id: string
	title: string
	description: string | null
	phone: string | null
	latitude: number
	longitude: number
	// Soft-delete: inactive gyms are hidden from members and refuse check-ins.
	is_active: boolean
}

// The API serializes latitude/longitude as strings (Prisma Decimal). Coerce
// them to numbers so the rest of the app can treat coordinates as numbers.
export function normalizeGym(gym: Gym): Gym {
	return {
		...gym,
		latitude: Number(gym.latitude),
		longitude: Number(gym.longitude),
	}
}

interface SearchGymsResponse {
	gyms: Gym[]
}

export interface SearchGymsParams {
	query: string
	page?: number
	// Managers only (honored server-side); members always get active-only.
	includeInactive?: boolean
}

export async function searchGyms({
	query,
	page = 1,
	includeInactive,
}: SearchGymsParams) {
	const response = await api.get<SearchGymsResponse>('/gyms/search', {
		params: {
			query,
			page,
			...(includeInactive ? { includeInactive: true } : {}),
		},
	})

	return response.data.gyms.map(normalizeGym)
}
