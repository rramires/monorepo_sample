import {
	type CreateScreenBody,
	screenSchema,
	type UpdateScreenBody,
} from '@root/contracts'
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

const listSchema = z.object({ screens: z.array(screenSchema) })
const oneSchema = z.object({ screen: screenSchema })

function toModel(s: z.infer<typeof screenSchema>): ScreenModel {
	return {
		id: s.id,
		moduleId: s.module_id,
		key: s.key,
		name: s.name,
		path: s.path ?? null,
		description: s.description ?? null,
		order: s.order,
	}
}

export async function getScreens(moduleId?: string): Promise<ScreenModel[]> {
	const response = await api.get('/screens', {
		params: moduleId ? { module_id: moduleId } : undefined,
	})
	return listSchema.parse(response.data).screens.map(toModel)
}

export async function createScreen(
	body: CreateScreenBody,
): Promise<ScreenModel> {
	const response = await api.post('/screens', body)
	return toModel(oneSchema.parse(response.data).screen)
}

export async function updateScreen(
	id: string,
	body: UpdateScreenBody,
): Promise<ScreenModel> {
	const response = await api.patch(`/screens/${id}`, body)
	return toModel(oneSchema.parse(response.data).screen)
}

export async function deleteScreen(id: string): Promise<void> {
	await api.delete(`/screens/${id}`)
}
