import { z } from 'zod'

import { roleSchema } from './primitives'

// One screen's effective permissions for the current user (union across all the
// user's profiles — each action is the OR over profiles). Keyed by screen `key`
// so the frontend can resolve grants without knowing screen ids.
export const screenPermissionSchema = z.object({
	screen_key: z.string(),
	view: z.boolean(),
	create: z.boolean(),
	edit: z.boolean(),
	delete: z.boolean(),
})
export type ScreenPermission = z.infer<typeof screenPermissionSchema>

// GET /me/permissions — drives the menu, the route guard and button visibility.
// ADMIN bypasses everything (every action resolves true) regardless of profiles.
export const mePermissionsSchema = z.object({
	role: roleSchema,
	screens: z.array(screenPermissionSchema),
})
export type MePermissions = z.infer<typeof mePermissionsSchema>
