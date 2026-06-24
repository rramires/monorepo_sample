import 'dotenv/config'

import { hash } from 'bcryptjs'

import { env } from '@/env'
import { prisma } from '@/lib/prisma'
import { Role } from '@/prisma-client/enums'

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
const MODULES = [
	{ key: 'access-control', name: 'Access Control', order: 0, is_system: true },
	{ key: 'gym', name: 'Gym', order: 1, is_system: false },
]

const SCREENS = [
	// access-control (system — protected)
	{ key: 'access-control.modules', name: 'Manage Modules', module: 'access-control', path: '/admin/modules', order: 0, is_system: true },
	{ key: 'access-control.screens', name: 'Manage Screens', module: 'access-control', path: '/admin/screens', order: 1, is_system: true },
	{ key: 'access-control.profiles', name: 'Manage Profiles', module: 'access-control', path: '/admin/profiles', order: 2, is_system: true },
	{ key: 'access-control.users', name: 'Manage Users', module: 'access-control', path: '/admin/users', order: 3, is_system: true },
	// gym (demo content — deletable)
	{ key: 'gym.dashboard', name: 'Dashboard', module: 'gym', path: '/', order: 0, is_system: false },
	{ key: 'gym.gyms', name: 'Gyms', module: 'gym', path: '/gyms', order: 1, is_system: false },
	{ key: 'gym.check-in', name: 'Check-in', module: 'gym', path: '/check-ins', order: 2, is_system: false },
	{ key: 'gym.history', name: 'Check-in History', module: 'gym', path: '/history', order: 3, is_system: false },
	{ key: 'gym.validations', name: 'Validate Check-ins', module: 'gym', path: '/validations', order: 4, is_system: false },
]

const PROFILES = [
	{ key: 'gym-member', name: 'Gym Member', description: 'Default profile granted on registration.', is_default: true },
	{ key: 'gym-manager', name: 'Gym Manager', description: 'Runs a gym: manages gyms and validates check-ins.', is_default: false },
	{ key: 'support', name: 'Support', description: 'Back-office: administers profiles and user access.', is_default: false },
]

type Grant = {
	screen: string
	create?: boolean
	edit?: boolean
	delete?: boolean
	default?: boolean
}
const GRANTS: Record<string, Grant[]> = {
	'gym-member': [
		{ screen: 'gym.dashboard', default: true },
		{ screen: 'gym.check-in', create: true },
		{ screen: 'gym.gyms' },
		{ screen: 'gym.history' },
	],
	'gym-manager': [
		{ screen: 'gym.dashboard', default: true },
		{ screen: 'gym.check-in', create: true },
		{ screen: 'gym.gyms', create: true, edit: true },
		{ screen: 'gym.history' },
		{ screen: 'gym.validations', create: true },
		{ screen: 'access-control.users', create: true },
	],
	support: [
		{
			screen: 'access-control.profiles',
			create: true,
			edit: true,
			delete: true,
			default: true,
		},
		{ screen: 'access-control.users', edit: true },
		{ screen: 'access-control.screens' },
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
			update: { name: m.name, order: m.order, is_system: m.is_system },
			create: m,
		})
		moduleId.set(m.key, row.id)
	}

	// Screens (by key) → id map.
	const screenId = new Map<string, string>()
	for (const s of SCREENS) {
		const row = await prisma.screen.upsert({
			where: { key: s.key },
			update: {
				name: s.name,
				path: s.path,
				order: s.order,
				is_system: s.is_system,
				module_id: moduleId.get(s.module)!,
			},
			create: {
				key: s.key,
				name: s.name,
				path: s.path,
				order: s.order,
				is_system: s.is_system,
				module_id: moduleId.get(s.module)!,
			},
		})
		screenId.set(s.key, row.id)
	}

	// Profiles (by key) → id map. is_system: seeded profiles are protected.
	const profileId = new Map<string, string>()
	for (const p of PROFILES) {
		const row = await prisma.profile.upsert({
			where: { key: p.key },
			update: {
				name: p.name,
				description: p.description,
				is_default: p.is_default,
			},
			create: { ...p, is_system: true },
		})
		profileId.set(p.key, row.id)
	}

	// Grants per profile (compound id profile_id+screen_id).
	for (const [profileKey, grants] of Object.entries(GRANTS)) {
		for (const g of grants) {
			const data = {
				can_view: true,
				can_create: g.create ?? false,
				can_edit: g.edit ?? false,
				can_delete: g.delete ?? false,
				is_default: g.default ?? false,
			}
			await prisma.profileScreen.upsert({
				where: {
					profile_id_screen_id: {
						profile_id: profileId.get(profileKey)!,
						screen_id: screenId.get(g.screen)!,
					},
				},
				update: data,
				create: {
					profile_id: profileId.get(profileKey)!,
					screen_id: screenId.get(g.screen)!,
					...data,
				},
			})
		}
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
