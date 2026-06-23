import { z } from 'zod'

// A module groups screens (e.g. "gym", "access-control"). Wire shape
// (snake_case); the Prisma model mirrors it field-for-field.
export const moduleSchema = z.object({
	id: z.string(),
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	order: z.number().int(),
})
export type Module = z.infer<typeof moduleSchema>

// POST /modules — create.
export const createModuleBodySchema = z.object({
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	order: z.number().int().default(0),
})
export type CreateModuleBody = z.infer<typeof createModuleBodySchema>

// PATCH /modules/:id — update; every field optional.
export const updateModuleBodySchema = createModuleBodySchema.partial()
export type UpdateModuleBody = z.infer<typeof updateModuleBodySchema>
