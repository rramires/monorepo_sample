import { z } from 'zod'

import { roleSchema } from './primitives'

// The action enum is the CODE contract — routes call `requireScreen('x','create')`
// and the frontend `can('x','create')`. The four actions are fixed; only their
// presentation (the friendly `label` below) and curation (which ones a screen
// actually has) vary. Never add/rename an action without touching code.
export const permissionActionSchema = z.enum([
	'view',
	'create',
	'edit',
	'delete',
])
export type PermissionAction = z.infer<typeof permissionActionSchema>

// A curated permission a screen actually offers. `action` is the fixed code
// contract; `label` is the friendly, editable display name (e.g. check-in's
// `create` is shown as "Check in"). UNIQUE(screen_id, action) — at most one
// permission per (screen, action). `is_system` mirrors its screen: seeded
// permissions are protected (no delete) just like seeded screens.
export const permissionSchema = z.object({
	id: z.string(),
	screen_id: z.string(),
	action: permissionActionSchema,
	label: z.string().min(1),
	is_system: z.boolean(),
})
export type Permission = z.infer<typeof permissionSchema>

// POST /screens/:screenId/permissions — add one curated op to a screen. The
// action must not already exist on the screen (UNIQUE), enforced server-side.
export const createPermissionBodySchema = z.object({
	action: permissionActionSchema,
	label: z.string().min(1),
})
export type CreatePermissionBody = z.infer<typeof createPermissionBodySchema>

// PATCH /permissions/:id — rename and/or re-target the op (the editor hides
// already-used actions); every field optional.
export const updatePermissionBodySchema = createPermissionBodySchema.partial()
export type UpdatePermissionBody = z.infer<typeof updatePermissionBodySchema>

// One screen's effective permissions for the current user (union across all the
// user's profiles — each action is the OR over profiles). Keyed by screen `key`
// so the frontend can resolve grants without knowing screen ids. `view` is now
// an explicit grant (no more default-true). Does NOT factor in the screen kill
// switch — `is_enabled` is carried on the menu entry and enforced separately so
// the guard can tell "no access" apart from "temporarily unavailable".
export const screenPermissionSchema = z.object({
	screen_key: z.string(),
	view: z.boolean(),
	create: z.boolean(),
	edit: z.boolean(),
	delete: z.boolean(),
})
export type ScreenPermission = z.infer<typeof screenPermissionSchema>

// One menu entry — a screen the user is a member of (assigned via a profile),
// shown in the sidebar even with zero granted permissions (staged rollout) or
// while killed. Carries the catalog bits the sidebar needs (names + module
// grouping + orders) plus the screen kill switch so the route guard can pick the
// right Forbidden message. Self-contained: no admin-only catalog fetch needed.
export const menuScreenSchema = z.object({
	screen_key: z.string(),
	screen_name: z.string(),
	path: z.string(),
	screen_order: z.number().int(),
	module_key: z.string(),
	module_name: z.string(),
	module_order: z.number().int(),
	// Kill switch (Screen.is_enabled). A killed screen still shows in the menu;
	// the guard blocks non-admins with "temporarily unavailable". Admin ignores it.
	is_enabled: z.boolean(),
})
export type MenuScreen = z.infer<typeof menuScreenSchema>

// GET /me/permissions — drives the menu, the route guard and button visibility.
// `menu` is the user's membership (sidebar); `screens` is the effective grants
// (button visibility + the guard's view check). ADMIN bypasses everything (every
// action resolves true, every screen enabled) regardless of profiles.
export const mePermissionsSchema = z.object({
	role: roleSchema,
	screens: z.array(screenPermissionSchema),
	// The membership screens (catalog), grouped/ordered by the frontend into the
	// sidebar. May include screens the user can't view yet or that are killed.
	menu: z.array(menuScreenSchema),
	// The resolved landing screen key (user override → profile default → null);
	// the frontend redirects here on login when set.
	default_screen_key: z.string().nullable(),
})
export type MePermissions = z.infer<typeof mePermissionsSchema>
