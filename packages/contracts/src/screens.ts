import { z } from 'zod'

// A screen belongs to a module and is the unit RBAC grants attach to. Its `key`
// is the stable identifier used everywhere (e.g. "gym.dashboard").
export const screenSchema = z.object({
	id: z.string(),
	module_id: z.string(),
	key: z.string().min(1),
	name: z.string().min(1),
	path: z.string().nullish(),
	description: z.string().nullish(),
	order: z.number().int(),
	// Seeded system screens are protected (no delete / no key rename); never
	// client-settable, so it stays out of the create/update bodies below.
	is_system: z.boolean(),
})
export type Screen = z.infer<typeof screenSchema>

// POST /screens — create.
export const createScreenBodySchema = z.object({
	module_id: z.string().min(1),
	key: z.string().min(1),
	name: z.string().min(1),
	path: z.string().nullish(),
	description: z.string().nullish(),
	order: z.number().int().default(0),
})
export type CreateScreenBody = z.infer<typeof createScreenBodySchema>

// PATCH /screens/:id — update; every field optional.
export const updateScreenBodySchema = createScreenBodySchema.partial()
export type UpdateScreenBody = z.infer<typeof updateScreenBodySchema>

// GET /screens?module_id — optional filter by module.
export const listScreensQuerySchema = z.object({
	module_id: z.string().optional(),
})
export type ListScreensQuery = z.infer<typeof listScreensQuerySchema>
