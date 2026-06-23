import { z } from 'zod'

import { api } from '@/lib/api'

const schema = z.object({ profile_ids: z.array(z.string()) })

export async function getUserProfiles(userId: string): Promise<string[]> {
	const response = await api.get(`/users/${userId}/profiles`)
	return schema.parse(response.data).profile_ids
}

export async function setUserProfiles(
	userId: string,
	profileIds: string[],
): Promise<string[]> {
	const response = await api.put(`/users/${userId}/profiles`, {
		profile_ids: profileIds,
	})
	return schema.parse(response.data).profile_ids
}
