import { z } from 'zod'

import { permissionSchema } from './permissions'

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
	// client-settable on create, so it stays out of the create body below.
	is_system: z.boolean(),
	// Lifecycle (disable). Inactive screens are hidden from the "add" pickers
	// below in the hierarchy (no new memberships); existing memberships keep
	// working until removed by hand. Toggled via the edit dialog's Active switch.
	is_active: z.boolean(),
	// Kill switch (On). When false the screen stops working NOW for all
	// non-admins (emergency: bad deploy) → "This screen is temporarily
	// unavailable."; reversible. Toggled via the edit dialog's On switch.
	is_enabled: z.boolean(),
})
export type Screen = z.infer<typeof screenSchema>

// A screen with its curated permission catalog — GET /screens/:id and the
// Screens permission editor.
export const screenWithPermissionsSchema = screenSchema.extend({
	permissions: z.array(permissionSchema),
})
export type ScreenWithPermissions = z.infer<typeof screenWithPermissionsSchema>

// POST /screens — create. `is_active`/`is_enabled` default true server-side, so
// they stay out of the create body (set via the edit dialog afterwards).
export const createScreenBodySchema = z.object({
	module_id: z.string().min(1),
	key: z.string().min(1),
	name: z.string().min(1),
	path: z.string().nullish(),
	description: z.string().nullish(),
	order: z.number().int().default(0),
})
export type CreateScreenBody = z.infer<typeof createScreenBodySchema>

// PATCH /screens/:id — update; every field optional. Adds the two lifecycle
// switches (Active / On) on top of the editable create fields.
export const updateScreenBodySchema = createScreenBodySchema.partial().extend({
	is_active: z.boolean().optional(),
	is_enabled: z.boolean().optional(),
})
export type UpdateScreenBody = z.infer<typeof updateScreenBodySchema>

// GET /screens?module_id — optional filter by module.
export const listScreensQuerySchema = z.object({
	module_id: z.string().optional(),
})
export type ListScreensQuery = z.infer<typeof listScreensQuerySchema>
