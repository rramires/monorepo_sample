import type {
	Module,
	Profile,
	ProfileScreen,
	Screen,
} from '@root/contracts'

// ─────────────────────────────────────────────────────────────────────────────
// Access-control seed — the single source of truth for the RBAC demo dataset.
// MSW reads + mutates these arrays now; the Prisma seed mirrors this file later
// (PLAN §4). Ids are human-readable so handlers and tests stay legible.
// ─────────────────────────────────────────────────────────────────────────────

// ── Modules ──────────────────────────────────────────────────────────────────
export const modules: Module[] = [
	{
		id: 'mod-access-control',
		key: 'access-control',
		name: 'Access Control',
		description: 'Manage modules, screens, profiles and user access.',
		order: 0,
	},
	{
		id: 'mod-gym',
		key: 'gym',
		name: 'Gym',
		description: 'The gym domain (dashboard, gyms, check-ins).',
		order: 1,
	},
]

// ── Screens ──────────────────────────────────────────────────────────────────
export const screens: Screen[] = [
	// access-control
	{
		id: 'scr-ac-modules',
		module_id: 'mod-access-control',
		key: 'access-control.modules',
		name: 'Manage Modules',
		path: '/admin/modules',
		order: 0,
	},
	{
		id: 'scr-ac-screens',
		module_id: 'mod-access-control',
		key: 'access-control.screens',
		name: 'Manage Screens',
		path: '/admin/screens',
		order: 1,
	},
	{
		id: 'scr-ac-profiles',
		module_id: 'mod-access-control',
		key: 'access-control.profiles',
		name: 'Manage Profiles',
		path: '/admin/profiles',
		order: 2,
	},
	{
		id: 'scr-ac-users',
		module_id: 'mod-access-control',
		key: 'access-control.users',
		name: 'Manage Users',
		path: '/admin/users',
		order: 3,
	},
	// gym
	{
		id: 'scr-gym-dashboard',
		module_id: 'mod-gym',
		key: 'gym.dashboard',
		name: 'Dashboard',
		path: '/',
		order: 0,
	},
	{
		id: 'scr-gym-gyms',
		module_id: 'mod-gym',
		key: 'gym.gyms',
		name: 'Gyms',
		path: '/gyms',
		order: 1,
	},
	{
		id: 'scr-gym-checkin',
		module_id: 'mod-gym',
		key: 'gym.check-in',
		name: 'Check-in',
		path: '/check-in',
		order: 2,
	},
	{
		id: 'scr-gym-history',
		module_id: 'mod-gym',
		key: 'gym.history',
		name: 'Check-in History',
		path: '/history',
		order: 3,
	},
	{
		id: 'scr-gym-validations',
		module_id: 'mod-gym',
		key: 'gym.validations',
		name: 'Validate Check-ins',
		path: '/validations',
		order: 4,
	},
]

// ── Profiles ─────────────────────────────────────────────────────────────────
export const profiles: Profile[] = [
	{
		id: 'prof-gym-member',
		key: 'gym-member',
		name: 'Gym Member',
		description: 'Default profile granted on registration.',
		is_system: true,
		is_default: true,
	},
	{
		id: 'prof-gym-manager',
		key: 'gym-manager',
		name: 'Gym Manager',
		description: 'Runs a gym: manages gyms and validates check-ins.',
		is_system: true,
		is_default: false,
	},
	{
		id: 'prof-support',
		key: 'support',
		name: 'Support',
		description: 'Back-office: administers profiles and user access.',
		is_system: true,
		is_default: false,
	},
]

// Grant helper: author by screen key + the actions that are true; everything
// else defaults to false (can_view defaults true for any listed screen).
type Grant = {
	screen_key: string
	create?: boolean
	edit?: boolean
	delete?: boolean
}

function grant(g: Grant): ProfileScreen {
	const screen = screens.find((s) => s.key === g.screen_key)
	if (!screen) {
		throw new Error(`Seed error: unknown screen "${g.screen_key}"`)
	}
	return {
		screen_id: screen.id,
		can_view: true,
		can_create: g.create ?? false,
		can_edit: g.edit ?? false,
		can_delete: g.delete ?? false,
	}
}

// Profile → its grants (PLAN §4). Mutable: PUT /profiles/:id/screens replaces an
// entry; the TransferTable reads it back.
export const profileScreens: Record<string, ProfileScreen[]> = {
	'prof-gym-member': [
		grant({ screen_key: 'gym.dashboard' }),
		grant({ screen_key: 'gym.check-in', create: true }),
		grant({ screen_key: 'gym.gyms' }),
		grant({ screen_key: 'gym.history' }),
	],
	'prof-gym-manager': [
		grant({ screen_key: 'gym.dashboard' }),
		grant({ screen_key: 'gym.check-in', create: true }),
		grant({ screen_key: 'gym.gyms', create: true, edit: true }),
		grant({ screen_key: 'gym.history' }),
		grant({ screen_key: 'gym.validations', create: true }),
		grant({ screen_key: 'access-control.users', create: true }),
	],
	'prof-support': [
		grant({
			screen_key: 'access-control.profiles',
			create: true,
			edit: true,
			delete: true,
		}),
		grant({ screen_key: 'access-control.users', edit: true }),
		grant({ screen_key: 'access-control.screens' }),
	],
}

// ── User ↔ Profile assignments ───────────────────────────────────────────────
// Mutable: PUT /users/:id/profiles replaces a user's list; POST /register
// appends the is_default profile. Admin holds none — the ADMIN role bypasses.
export const userProfiles: { user_id: string; profile_id: string }[] = [
	{ user_id: 'mock-user-id', profile_id: 'prof-gym-member' },
	{ user_id: 'mock-manager-id', profile_id: 'prof-gym-manager' },
	{ user_id: 'mock-support-id', profile_id: 'prof-support' },
]
