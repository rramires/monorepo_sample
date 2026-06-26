import { afterAll, beforeAll, describe } from 'vitest'

import { app } from '@/app'
import {
	type GuardFixtures,
	type GuardRoute,
	runScreenGuardBattery,
	seedScreenGuardFixtures,
} from '@/utils/tests/screen-guard-battery'

// Screen-guard battery — the people admin screens (Profiles + Users).
describe('Screen guard — access-control people (e2e)', () => {
	let fixtures: GuardFixtures

	beforeAll(async () => {
		await app.ready()
		fixtures = await seedScreenGuardFixtures(app, [
			{
				key: 'access-control.profiles',
				path: '/admin/profiles',
				actions: ['view', 'create', 'edit', 'delete'],
			},
			{
				key: 'access-control.users',
				path: '/admin/users',
				actions: ['view', 'create', 'edit', 'delete'],
			},
		])
	})

	afterAll(async () => {
		await app.close()
	})

	const routes: GuardRoute[] = [
		// access-control.profiles
		['GET', '/profiles', 'access-control.profiles', 'view'],
		['GET', '/profiles/x', 'access-control.profiles', 'view'],
		['POST', '/profiles', 'access-control.profiles', 'create'],
		['PATCH', '/profiles/x', 'access-control.profiles', 'edit'],
		['DELETE', '/profiles/x', 'access-control.profiles', 'delete'],
		['PUT', '/profiles/x/screens', 'access-control.profiles', 'edit'],
		// access-control.users
		['GET', '/users', 'access-control.users', 'view'],
		['GET', '/users/x', 'access-control.users', 'view'],
		['PATCH', '/users/x', 'access-control.users', 'edit'],
		['GET', '/users/x/profiles', 'access-control.users', 'view'],
		['PUT', '/users/x/profiles', 'access-control.users', 'edit'],
	]

	runScreenGuardBattery(app, routes, () => fixtures)
})
