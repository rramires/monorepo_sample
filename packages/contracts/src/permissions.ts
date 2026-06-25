import { z } from 'zod'

import { roleSchema } from './primitives'

// The four CRUD FAMILIES are the fixed semantic roots. They are no longer the
// whole story: a permission's `action` is now a free string KEY whose family
// (the part before the first `_`) must be one of these four. A bare family
// (`create`) is the simple case; a composed key (`create_checkin`) lets a screen
// carry MANY ops of the same family without spawning a phantom screen. Routes
// call `requireScreen('x','create_checkin')` and the frontend `can('x',key)`.
export const permissionFamilySchema = z.enum(['view', 'create', 'edit', 'delete'])
export type PermissionFamily = z.infer<typeof permissionFamilySchema>
export const PERMISSION_FAMILIES = permissionFamilySchema.options

// The family of an action key = everything before the first underscore (a bare
// key is its own family). `create_checkin` → `create`; `view` → `view`. Single
// rule, used both to validate keys and to drive family-aware UI.
export function actionFamily(key: string): string {
	const i = key.indexOf('_')
	return i === -1 ? key : key.slice(0, i)
}

// Build a composed key from a family + a free name part. The editor sends the
// final composed key; this is the one place that convention is encoded.
export function composeActionKey(family: string, name: string): string {
	return `${family}_${name}`
}

// An action KEY: lowercase + underscores, family ∈ the four CRUD families. The
// bare families pass (`actionFamily('view') === 'view'`); composed keys
// (`create_checkin`) pass too. Max 40 chars total. This replaces the old enum as
// the code contract for `permission.action`.
export const actionKeySchema = z
	.string()
	.trim()
	.max(40)
	.regex(/^[a-z][a-z_]*$/, 'Use lowercase letters and underscores only.')
	.refine((k) => (PERMISSION_FAMILIES as readonly string[]).includes(actionFamily(k)), {
		message: 'Action must start with a CRUD family (view/create/edit/delete).',
	})

// The friendly, editable display name for a permission (e.g. `create_checkin` is
// shown as "Check in"). Letters/digits/space/hyphen, must start with a letter;
// trimmed, 3–40 chars. Looser than the key on purpose — it is display text.
export const actionLabelSchema = z
	.string()
	.trim()
	.min(3)
	.max(40)
	.regex(/^[A-Za-z][A-Za-z0-9 -]*$/, 'Letters, digits, spaces and hyphens only.')

// A curated permission a screen actually offers. `action` is the free-key code
// contract; `label` is the friendly, editable display name. UNIQUE(screen_id,
// action) — at most one permission per (screen, action key). `is_system` mirrors
// its screen: seeded permissions are protected (no delete) like seeded screens.
export const permissionSchema = z.object({
	id: z.string(),
	screen_id: z.string(),
	action: actionKeySchema,
	label: actionLabelSchema,
	is_system: z.boolean(),
})
export type Permission = z.infer<typeof permissionSchema>

// POST /screens/:screenId/permissions — add one curated op to a screen. The
// editor sends the FINAL composed key (e.g. `create_checkin`). The key must not
// already exist on the screen (UNIQUE), enforced server-side.
export const createPermissionBodySchema = z.object({
	action: actionKeySchema,
	label: actionLabelSchema,
})
export type CreatePermissionBody = z.infer<typeof createPermissionBodySchema>

// PATCH /permissions/:id — rename and/or re-key the op; every field optional.
export const updatePermissionBodySchema = createPermissionBodySchema.partial()
export type UpdatePermissionBody = z.infer<typeof updatePermissionBodySchema>

// One screen's effective permissions for the current user (union across all the
// user's profiles). `actions` is the set of granted action KEYS for the screen —
// `can(key, action) = actions.includes(action)`. Keyed by screen `key` so the
// frontend resolves grants without knowing screen ids. Does NOT factor in the
// screen kill switch — `is_enabled` is carried on the menu entry and enforced
// separately so the guard can tell "no access" apart from "temporarily
// unavailable".
export const screenPermissionSchema = z.object({
	screen_key: z.string(),
	actions: z.array(z.string()),
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
