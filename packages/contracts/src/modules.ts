import { z } from 'zod'

// A module groups screens (e.g. "gym", "access-control"). Wire shape
// (snake_case); the Prisma model mirrors it field-for-field.
export const moduleSchema = z.object({
	id: z.string(),
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	order: z.number().int(),
	// Seeded system modules are protected (no delete / no key rename); never
	// client-settable on create, so it stays out of the create body below.
	is_system: z.boolean(),
	// Lifecycle (disable). Inactive modules are hidden from the "add" pickers
	// below (no new screens target them); existing screens keep working. Toggled
	// via the edit dialog's Active switch.
	is_active: z.boolean(),
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

// PATCH /modules/:id — update; every field optional. Adds the Active switch on
// top of the editable create fields.
export const updateModuleBodySchema = createModuleBodySchema.partial().extend({
	is_active: z.boolean().optional(),
})
export type UpdateModuleBody = z.infer<typeof updateModuleBodySchema>
