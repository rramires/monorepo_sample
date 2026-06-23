import {
	type CreateModuleBody,
	moduleSchema,
	type UpdateModuleBody,
} from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

export interface ModuleModel {
	id: string
	key: string
	name: string
	description: string | null
	order: number
}

const listSchema = z.object({ modules: z.array(moduleSchema) })
const oneSchema = z.object({ module: moduleSchema })

function toModel(m: z.infer<typeof moduleSchema>): ModuleModel {
	return {
		id: m.id,
		key: m.key,
		name: m.name,
		description: m.description ?? null,
		order: m.order,
	}
}

export async function getModules(): Promise<ModuleModel[]> {
	const response = await api.get('/modules')
	return listSchema.parse(response.data).modules.map(toModel)
}

export async function createModule(
	body: CreateModuleBody,
): Promise<ModuleModel> {
	const response = await api.post('/modules', body)
	return toModel(oneSchema.parse(response.data).module)
}

export async function updateModule(
	id: string,
	body: UpdateModuleBody,
): Promise<ModuleModel> {
	const response = await api.patch(`/modules/${id}`, body)
	return toModel(oneSchema.parse(response.data).module)
}

export async function deleteModule(id: string): Promise<void> {
	await api.delete(`/modules/${id}`)
}
