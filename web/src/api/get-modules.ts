import { moduleSchema } from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

export interface ModuleModel {
	id: string
	key: string
	name: string
	description: string | null
	order: number
}

const responseSchema = z.object({ modules: z.array(moduleSchema) })

export async function getModules(): Promise<ModuleModel[]> {
	const response = await api.get('/modules')
	const { modules } = responseSchema.parse(response.data)

	return modules.map((m) => ({
		id: m.id,
		key: m.key,
		name: m.name,
		description: m.description ?? null,
		order: m.order,
	}))
}
