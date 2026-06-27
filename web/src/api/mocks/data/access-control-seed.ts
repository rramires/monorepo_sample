import type { Module, Permission, Profile, Screen } from '@root/contracts'

// ─────────────────────────────────────────────────────────────────────────────
// Access-control seed — the single source of truth for the RBAC demo dataset.
// MSW reads + mutates these arrays now; the Prisma seed mirrors this file later
// (PLAN G5). Ids are human-readable so handlers and tests stay legible.
//
// Model (PLAN): modules 1─N screens 1─N permissions; profiles carry MEMBERSHIP
// (`profileScreens`, which screens are in the sidebar) + GRANTS
// (`profilePermissions`, which curated ops are allowed) + a landing screen
// (`profileDefaultScreen`). `view` is now an explicit granted permission.
// ─────────────────────────────────────────────────────────────────────────────

// ── Modules ──────────────────────────────────────────────────────────────────
export const modules: Module[] = [
	{
		id: 'mod-gym',
		key: 'gym',
		name: 'Gym',
		description: 'Dashboard, gyms and check-ins.',
		order: 0,
		is_system: false,
		is_active: true,
	},
	{
		id: 'mod-access-control',
		key: 'access-control',
		name: 'Access Control',
		description: 'Modules, screens, profiles, users.',
		order: 1,
		// System catalog — protected from web-UI deletion / key rename.
		is_system: true,
		is_active: true,
	},
	{
		id: 'mod-notices',
		key: 'notices',
		name: 'Notices',
		description: 'Notice board for members.',
		order: 3,
		is_system: false,
		is_active: true,
	},
]

// ── Screens ──────────────────────────────────────────────────────────────────
// `is_active` (lifecycle) + `is_enabled` (kill switch) default true.
export const screens: Screen[] = [
	// gym (demo content — deletable)
	{
		id: 'scr-gym-dashboard',
		module_id: 'mod-gym',
		key: 'gym.dashboard',
		name: 'Dashboard',
		path: '/',
		description: 'Activity at a glance.',
		order: 0,
		is_system: false,
		is_active: true,
		is_enabled: true,
	},
	{
		id: 'scr-gym-gyms',
		module_id: 'mod-gym',
		key: 'gym.gyms',
		name: 'Gyms',
		path: '/gyms',
		description: 'Browse and manage gyms.',
		order: 1,
		is_system: false,
		is_active: true,
		is_enabled: true,
	},
	{
		id: 'scr-gym-checkin',
		module_id: 'mod-gym',
		key: 'gym.check-ins',
		name: 'Check-ins',
		path: '/check-ins',
		description: 'Check in to a gym and validate members.',
		order: 2,
		is_system: false,
		is_active: true,
		is_enabled: true,
	},
	// access-control (system — protected)
	{
		id: 'scr-ac-modules',
		module_id: 'mod-access-control',
		key: 'access-control.modules',
		name: 'Manage Modules',
		path: '/admin/modules',
		description: 'Group screens into modules.',
		order: 0,
		is_system: true,
		is_active: true,
		is_enabled: true,
	},
	{
		id: 'scr-ac-screens',
		module_id: 'mod-access-control',
		key: 'access-control.screens',
		name: 'Manage Screens',
		path: '/admin/screens',
		description: 'Screens and their permissions.',
		order: 1,
		is_system: true,
		is_active: true,
		is_enabled: true,
	},
	{
		id: 'scr-ac-profiles',
		module_id: 'mod-access-control',
		key: 'access-control.profiles',
		name: 'Manage Profiles',
		path: '/admin/profiles',
		description: 'Bundle permissions into profiles.',
		order: 2,
		is_system: true,
		is_active: true,
		is_enabled: true,
	},
	{
		id: 'scr-ac-users',
		module_id: 'mod-access-control',
		key: 'access-control.users',
		name: 'Manage Users',
		path: '/admin/users',
		description: 'Users and their profiles.',
		order: 3,
		is_system: true,
		is_active: true,
		is_enabled: true,
	},
	{
		id: 'scr-notices',
		module_id: 'mod-notices',
		key: 'notices.notices',
		name: 'Notices',
		path: '/notices',
		description: 'Notice board for members.',
		order: 0,
		is_system: false,
		is_active: true,
		is_enabled: true,
	},
]

// ── Permissions catalog ──────────────────────────────────────────────────────
// Curated per screen with friendly labels — only the ops a screen really has.
// `is_system` mirrors the screen. UNIQUE(screen_id, action) holds by construction.
// `gym.gyms` and `access-control.users` deliberately have NO `delete` (they
// deactivate via the Active switch), which is what kills the phantom ops.
type PermSpec = { screen_key: string; action: string; label: string }

const PERMISSION_SPECS: PermSpec[] = [
	{ screen_key: 'gym.dashboard', action: 'view', label: 'View' },
	{ screen_key: 'gym.gyms', action: 'view', label: 'View' },
	{ screen_key: 'gym.gyms', action: 'create', label: 'Add' },
	{ screen_key: 'gym.gyms', action: 'edit', label: 'Edit' },
	// Extra create op on the Gyms screen — kills the old phantom gym.check-in.
	{ screen_key: 'gym.gyms', action: 'create_checkin', label: 'Check in' },
	{ screen_key: 'gym.check-ins', action: 'view', label: 'View' },
	// Extra edit op on the Check-ins screen — kills the old phantom gym.validations.
	{ screen_key: 'gym.check-ins', action: 'edit_validate', label: 'Validate' },
	{ screen_key: 'access-control.modules', action: 'view', label: 'View' },
	{ screen_key: 'access-control.modules', action: 'create', label: 'Add' },
	{ screen_key: 'access-control.modules', action: 'edit', label: 'Edit' },
	{ screen_key: 'access-control.modules', action: 'delete', label: 'Remove' },
	{ screen_key: 'access-control.screens', action: 'view', label: 'View' },
	{ screen_key: 'access-control.screens', action: 'create', label: 'Add' },
	{ screen_key: 'access-control.screens', action: 'edit', label: 'Edit' },
	{ screen_key: 'access-control.screens', action: 'delete', label: 'Remove' },
	{ screen_key: 'access-control.profiles', action: 'view', label: 'View' },
	{ screen_key: 'access-control.profiles', action: 'create', label: 'Add' },
	{ screen_key: 'access-control.profiles', action: 'edit', label: 'Edit' },
	{
		screen_key: 'access-control.profiles',
		action: 'delete',
		label: 'Remove',
	},
	{ screen_key: 'access-control.users', action: 'view', label: 'View' },
	{ screen_key: 'access-control.users', action: 'create', label: 'Add' },
	{ screen_key: 'access-control.users', action: 'edit', label: 'Edit' },
	{ screen_key: 'notices.notices', action: 'view', label: 'View' },
	{ screen_key: 'notices.notices', action: 'create', label: 'Add' },
	{ screen_key: 'notices.notices', action: 'edit', label: 'Edit' },
	{ screen_key: 'notices.notices', action: 'delete', label: 'Remove' },
]

function screenByKey(key: string): Screen {
	const screen = screens.find((s) => s.key === key)
	if (!screen) {
		throw new Error(`Seed error: unknown screen "${key}"`)
	}
	return screen
}

// `perm-<screen-suffix>-<action>` e.g. perm-gym-gyms-create / perm-ac-modules-delete.
function permId(screen: Screen, action: string): string {
	return `perm-${screen.id.replace(/^scr-/, '')}-${action}`
}

export const permissions: Permission[] = PERMISSION_SPECS.map((spec) => {
	const screen = screenByKey(spec.screen_key)
	return {
		id: permId(screen, spec.action),
		screen_id: screen.id,
		action: spec.action,
		label: spec.label,
		is_system: screen.is_system,
	}
})

// Look up a catalog permission id by screen key + action (seed authoring helper).
function grantId(screenKey: string, action: string): string {
	const screen = screenByKey(screenKey)
	const id = permId(screen, action)
	if (!permissions.some((p) => p.id === id)) {
		throw new Error(
			`Seed error: ${screenKey} has no "${action}" permission`,
		)
	}
	return id
}

// ── Profiles ─────────────────────────────────────────────────────────────────
export const profiles: Profile[] = [
	{
		id: 'prof-gym-member',
		key: 'gym-member',
		name: 'Gym Member',
		description: 'Default profile granted on registration.',
		is_system: true,
		is_default: true,
		is_active: true,
	},
	{
		id: 'prof-gym-manager',
		key: 'gym-manager',
		name: 'Gym Manager',
		description: 'Runs a gym: manages gyms and validates check-ins.',
		is_system: true,
		is_default: false,
		is_active: true,
	},
	{
		id: 'prof-support',
		key: 'support',
		name: 'Support',
		description: 'Back-office: administers profiles and user access.',
		is_system: true,
		is_default: false,
		is_active: true,
	},
]

// Author a profile by screen + the granted ops on it; `landing` marks the
// profile's default screen. Membership = the listed screens (a screen with an
// empty `ops` would be member-only — staged rollout — none seeded by default).
type ProfileSpec = {
	screen_key: string
	ops: string[]
	landing?: boolean
}

const PROFILE_SPECS: Record<string, ProfileSpec[]> = {
	'prof-gym-member': [
		{ screen_key: 'gym.dashboard', ops: ['view'], landing: true },
		{ screen_key: 'gym.gyms', ops: ['view', 'create_checkin'] },
		{ screen_key: 'gym.check-ins', ops: ['view'] },
	],
	'prof-gym-manager': [
		{ screen_key: 'gym.dashboard', ops: ['view'], landing: true },
		{
			screen_key: 'gym.gyms',
			ops: ['view', 'create', 'edit', 'create_checkin'],
		},
		{ screen_key: 'gym.check-ins', ops: ['view', 'edit_validate'] },
		{ screen_key: 'access-control.users', ops: ['view', 'create'] },
	],
	'prof-support': [
		{
			screen_key: 'access-control.profiles',
			ops: ['view', 'create', 'edit', 'delete'],
			landing: true,
		},
		{ screen_key: 'access-control.users', ops: ['view', 'edit'] },
		{ screen_key: 'access-control.screens', ops: ['view'] },
	],
}

function membershipFrom(specs: ProfileSpec[]): string[] {
	return specs.map((s) => screenByKey(s.screen_key).id)
}

function grantsFrom(specs: ProfileSpec[]): string[] {
	return specs.flatMap((s) => s.ops.map((op) => grantId(s.screen_key, op)))
}

function landingFrom(specs: ProfileSpec[]): string | null {
	const landing = specs.find((s) => s.landing)
	return landing ? screenByKey(landing.screen_key).id : null
}

// Profile → membership (screen ids in the sidebar). Mutable: PUT
// /profiles/:id/screens replaces it; the TransferTable reads it back.
export const profileScreens: Record<string, string[]> = Object.fromEntries(
	Object.entries(PROFILE_SPECS).map(([pid, specs]) => [
		pid,
		membershipFrom(specs),
	]),
)

// Profile → granted permission ids (the curated ops it's allowed). Mutable:
// replaced together with membership on save.
export const profilePermissions: Record<string, string[]> = Object.fromEntries(
	Object.entries(PROFILE_SPECS).map(([pid, specs]) => [
		pid,
		grantsFrom(specs),
	]),
)

// Profile → landing screen id (≤1). Mutable: set on save. Replaces the old
// per-grant `is_default` flag.
export const profileDefaultScreen: Record<string, string | null> =
	Object.fromEntries(
		Object.entries(PROFILE_SPECS).map(([pid, specs]) => [
			pid,
			landingFrom(specs),
		]),
	)

// ── User ↔ Profile assignments ───────────────────────────────────────────────
// Mutable: PUT /users/:id/profiles replaces a user's list; POST /register
// appends the is_default profile. Admin holds none — the ADMIN role bypasses.
export const userProfiles: { user_id: string; profile_id: string }[] = [
	{ user_id: 'mock-user-id', profile_id: 'prof-gym-member' },
	{ user_id: 'mock-manager-id', profile_id: 'prof-gym-manager' },
	{ user_id: 'mock-support-id', profile_id: 'prof-support' },
]

// Per-user preferred landing screen (overrides the profile default). Mutable:
// PATCH /auth/me sets it. Keyed by user id → screen key (or null to clear).
export const userDefaultScreen: Record<string, string | null> = {}
