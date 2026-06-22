import { screenSchema } from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

export interface ScreenModel {
	id: string
	moduleId: string
	key: string
	name: string
	path: string | null
	description: string | null
	order: number
}

const responseSchema = z.object({ screens: z.array(screenSchema) })

export async function getScreens(moduleId?: string): Promise<ScreenModel[]> {
	const response = await api.get('/screens', {
		params: moduleId ? { module_id: moduleId } : undefined,
	})
	const { screens } = responseSchema.parse(response.data)

	return screens.map((s) => ({
		id: s.id,
		moduleId: s.module_id,
		key: s.key,
		name: s.name,
		path: s.path ?? null,
		description: s.description ?? null,
		order: s.order,
	}))
}
