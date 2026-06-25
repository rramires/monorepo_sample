import 'dotenv/config'

import { hash } from 'bcryptjs'

import { env } from '@/env'
import { prisma } from '@/lib/prisma'
import { PermissionAction, Role } from '@/prisma-client/enums'

// Idempotent ADMIN seed: creates the admin user from environment-provided
// credentials if it does not exist yet. Safe to run repeatedly — an existing
// admin is left untouched (update: {}), so its password is never reset.
async function seedAdminRole() {
	const password_hash = await hash(env.ADMIN_PASSWORD, 12)

	const admin = await prisma.user.upsert({
		where: { email: env.ADMIN_EMAIL },
		update: {},
		create: {
			username: env.ADMIN_USERNAME,
			email: env.ADMIN_EMAIL,
			password_hash,
			role: Role.ADMIN,
			// Admin can't verify via an email it may not control; seed as verified
			// so REQUIRE_EMAIL_VERIFICATION=true never locks the admin out.
			is_verified: true,
		},
	})

	console.log(`Admin user ready: ${admin.email}`)
}

// ─── Access-control catalog + demo data (mirrors the web MSW seed) ───────────
// is_system protects the access-control catalog from web-UI deletion / key
// rename; the gym module and its screens stay deletable demo content.
// Gym is order 0 so it leads the sidebar; the access-control catalog follows.
// is_active (modules/screens/profiles) + is_enabled (screens) default true.
const MODULES = [
	{ key: 'gym', name: 'Gym', description: 'Dashboard, gyms and check-ins.', order: 0, is_system: false },
	{ key: 'access-control', name: 'Access Control', description: 'Modules, screens, profiles, users.', order: 1, is_system: true },
]

const SCREENS = [
	// gym (demo content — deletable)
	{ key: 'gym.dashboard', name: 'Dashboard', module: 'gym', path: '/', description: 'Activity at a glance.', order: 0, is_system: false },
	{ key: 'gym.gyms', name: 'Gyms', module: 'gym', path: '/gyms', description: 'Browse and manage gyms.', order: 1, is_system: false },
	{ key: 'gym.check-in', name: 'Check-in', module: 'gym', path: '/check-ins', description: 'Check in to a gym.', order: 2, is_system: false },
	{ key: 'gym.history', name: 'Check-in History', module: 'gym', path: '/history', description: 'Your past check-ins.', order: 3, is_system: false },
	{ key: 'gym.validations', name: 'Validate Check-ins', module: 'gym', path: '/validations', description: 'Approve member check-ins.', order: 4, is_system: false },
	// access-control (system — protected)
	{ key: 'access-control.modules', name: 'Manage Modules', module: 'access-control', path: '/admin/modules', description: 'Group screens into modules.', order: 0, is_system: true },
	{ key: 'access-control.screens', name: 'Manage Screens', module: 'access-control', path: '/admin/screens', description: 'Screens and their permissions.', order: 1, is_system: true },
	{ key: 'access-control.profiles', name: 'Manage Profiles', module: 'access-control', path: '/admin/profiles', description: 'Bundle permissions into profiles.', order: 2, is_system: true },
	{ key: 'access-control.users', name: 'Manage Users', module: 'access-control', path: '/admin/users', description: 'Users and their profiles.', order: 3, is_system: true },
]

// Curated permission catalog with friendly labels — only the ops a screen really
// has. gym.gyms and access-control.users deliberately have NO delete (they
// deactivate via the Active switch). is_system mirrors the screen.
type PermSpec = { screen: string; action: PermissionAction; label: string }
const PERMISSIONS: PermSpec[] = [
	{ screen: 'gym.dashboard', action: 'view', label: 'View' },
	{ screen: 'gym.gyms', action: 'view', label: 'View' },
	{ screen: 'gym.gyms', action: 'create', label: 'Add' },
	{ screen: 'gym.gyms', action: 'edit', label: 'Edit' },
	{ screen: 'gym.check-in', action: 'view', label: 'View' },
	{ screen: 'gym.check-in', action: 'create', label: 'Check in' },
	{ screen: 'gym.history', action: 'view', label: 'View' },
	{ screen: 'gym.validations', action: 'view', label: 'View' },
	{ screen: 'gym.validations', action: 'create', label: 'Validate' },
	{ screen: 'access-control.modules', action: 'view', label: 'View' },
	{ screen: 'access-control.modules', action: 'create', label: 'Add' },
	{ screen: 'access-control.modules', action: 'edit', label: 'Edit' },
	{ screen: 'access-control.modules', action: 'delete', label: 'Remove' },
	{ screen: 'access-control.screens', action: 'view', label: 'View' },
	{ screen: 'access-control.screens', action: 'create', label: 'Add' },
	{ screen: 'access-control.screens', action: 'edit', label: 'Edit' },
	{ screen: 'access-control.screens', action: 'delete', label: 'Remove' },
	{ screen: 'access-control.profiles', action: 'view', label: 'View' },
	{ screen: 'access-control.profiles', action: 'create', label: 'Add' },
	{ screen: 'access-control.profiles', action: 'edit', label: 'Edit' },
	{ screen: 'access-control.profiles', action: 'delete', label: 'Remove' },
	{ screen: 'access-control.users', action: 'view', label: 'View' },
	{ screen: 'access-control.users', action: 'create', label: 'Add' },
	{ screen: 'access-control.users', action: 'edit', label: 'Edit' },
]

const PROFILES = [
	{ key: 'gym-member', name: 'Gym Member', description: 'Default profile granted on registration.', is_default: true },
	{ key: 'gym-manager', name: 'Gym Manager', description: 'Runs a gym: manages gyms and validates check-ins.', is_default: false },
	{ key: 'support', name: 'Support', description: 'Back-office: administers profiles and user access.', is_default: false },
]

// Per profile: membership (screen) + the granted ops on it; `landing` is the
// profile's default screen. Membership = the listed screens.
type GrantSpec = { screen: string; ops: PermissionAction[]; landing?: boolean }
const PROFILE_GRANTS: Record<string, GrantSpec[]> = {
	'gym-member': [
		{ screen: 'gym.dashboard', ops: ['view'], landing: true },
		{ screen: 'gym.check-in', ops: ['view', 'create'] },
		{ screen: 'gym.gyms', ops: ['view'] },
		{ screen: 'gym.history', ops: ['view'] },
	],
	'gym-manager': [
		{ screen: 'gym.dashboard', ops: ['view'], landing: true },
		{ screen: 'gym.check-in', ops: ['view', 'create'] },
		{ screen: 'gym.gyms', ops: ['view', 'create', 'edit'] },
		{ screen: 'gym.history', ops: ['view'] },
		{ screen: 'gym.validations', ops: ['view', 'create'] },
		{ screen: 'access-control.users', ops: ['view', 'create'] },
	],
	support: [
		{ screen: 'access-control.profiles', ops: ['view', 'create', 'edit', 'delete'], landing: true },
		{ screen: 'access-control.users', ops: ['view', 'edit'] },
		{ screen: 'access-control.screens', ops: ['view'] },
	],
}

// Demo users (USER role) — password is the same as the admin's for convenience
// in this sample. Each maps to one seeded profile so the menu/guards differ.
const DEMO_USERS = [
	{ username: 'johndoe', email: 'johndoe@example.com', profile: 'gym-member' },
	{ username: 'manager', email: 'manager@example.com', profile: 'gym-manager' },
	{ username: 'support', email: 'support@example.com', profile: 'support' },
]

async function seedAccessControl() {
	// Modules (by key) → id map.
	const moduleId = new Map<string, string>()
	for (const m of MODULES) {
		const row = await prisma.module.upsert({
			where: { key: m.key },
			update: { name: m.name, description: m.description, order: m.order, is_system: m.is_system },
			create: m,
		})
		moduleId.set(m.key, row.id)
	}

	// Screens (by key) → id map.
	const screenId = new Map<string, string>()
	for (const s of SCREENS) {
		const data = {
			name: s.name,
			path: s.path,
			description: s.description,
			order: s.order,
			is_system: s.is_system,
			module_id: moduleId.get(s.module)!,
		}
		const row = await prisma.screen.upsert({
			where: { key: s.key },
			update: data,
			create: { key: s.key, ...data },
		})
		screenId.set(s.key, row.id)
	}

	// Permissions (by screen_id + action) → id map keyed by "screenKey:action".
	const permId = new Map<string, string>()
	for (const p of PERMISSIONS) {
		const sid = screenId.get(p.screen)!
		const is_system = SCREENS.find((s) => s.key === p.screen)!.is_system
		const row = await prisma.permission.upsert({
			where: { screen_id_action: { screen_id: sid, action: p.action } },
			update: { label: p.label, is_system },
			create: { screen_id: sid, action: p.action, label: p.label, is_system },
		})
		permId.set(`${p.screen}:${p.action}`, row.id)
	}

	// Profiles (by key) → id map. is_system: seeded profiles are protected.
	const profileId = new Map<string, string>()
	for (const p of PROFILES) {
		const row = await prisma.profile.upsert({
			where: { key: p.key },
			update: { name: p.name, description: p.description, is_default: p.is_default },
			create: { ...p, is_system: true },
		})
		profileId.set(p.key, row.id)
	}

	// Per profile: membership (profile_screens), grants (profile_permissions),
	// landing (profiles.default_screen_id).
	for (const [profileKey, grants] of Object.entries(PROFILE_GRANTS)) {
		const pid = profileId.get(profileKey)!
		for (const g of grants) {
			const sid = screenId.get(g.screen)!
			await prisma.profileScreen.upsert({
				where: { profile_id_screen_id: { profile_id: pid, screen_id: sid } },
				update: {},
				create: { profile_id: pid, screen_id: sid },
			})
			for (const op of g.ops) {
				const pmid = permId.get(`${g.screen}:${op}`)!
				await prisma.profilePermission.upsert({
					where: { profile_id_permission_id: { profile_id: pid, permission_id: pmid } },
					update: {},
					create: { profile_id: pid, permission_id: pmid },
				})
			}
		}
		// Landing screen for the profile (if any).
		const landing = grants.find((g) => g.landing)
		await prisma.profile.update({
			where: { id: pid },
			data: { default_screen_id: landing ? screenId.get(landing.screen)! : null },
		})
	}

	// Demo users + their profile assignment.
	const password_hash = await hash(env.ADMIN_PASSWORD, 12)
	for (const u of DEMO_USERS) {
		const user = await prisma.user.upsert({
			where: { email: u.email },
			update: {},
			create: {
				username: u.username,
				email: u.email,
				password_hash,
				role: Role.USER,
				is_verified: true,
			},
		})
		await prisma.userProfile.upsert({
			where: {
				user_id_profile_id: {
					user_id: user.id,
					profile_id: profileId.get(u.profile)!,
				},
			},
			update: {},
			create: {
				user_id: user.id,
				profile_id: profileId.get(u.profile)!,
			},
		})
	}

	console.log('Access-control catalog + demo users ready.')
}

seedAdminRole()
	.then(() => seedAccessControl())
	.then(() => prisma.$disconnect())
	.catch(async (error) => {
		console.error(error)
		await prisma.$disconnect()
		process.exit(1)
	})
