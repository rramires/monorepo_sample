import { afterAll, beforeAll, describe } from 'vitest'

import { app } from '@/app'
import {
	type GuardFixtures,
	type GuardRoute,
	runScreenGuardBattery,
	seedScreenGuardFixtures,
} from '@/utils/tests/screen-guard-battery'

// Screen-guard battery — the catalog admin screens (Modules, Screens, and the
// permission catalog, which is gated by access-control.screens).
describe('Screen guard — access-control catalog (e2e)', () => {
	let fixtures: GuardFixtures

	beforeAll(async () => {
		await app.ready()
		fixtures = await seedScreenGuardFixtures(app, [
			{
				key: 'access-control.modules',
				path: '/admin/modules',
				actions: ['view', 'create', 'edit', 'delete'],
			},
			{
				key: 'access-control.screens',
				path: '/admin/screens',
				actions: ['view', 'create', 'edit', 'delete'],
			},
		])
	})

	afterAll(async () => {
		await app.close()
	})

	const routes: GuardRoute[] = [
		// access-control.modules
		['GET', '/modules', 'access-control.modules', 'view'],
		['POST', '/modules', 'access-control.modules', 'create'],
		['PATCH', '/modules/x', 'access-control.modules', 'edit'],
		['DELETE', '/modules/x', 'access-control.modules', 'delete'],
		// access-control.screens
		['GET', '/screens', 'access-control.screens', 'view'],
		['POST', '/screens', 'access-control.screens', 'create'],
		['PATCH', '/screens/x', 'access-control.screens', 'edit'],
		['DELETE', '/screens/x', 'access-control.screens', 'delete'],
		// permission catalog (gated by access-control.screens)
		['GET', '/permissions', 'access-control.screens', 'view'],
		['POST', '/screens/x/permissions', 'access-control.screens', 'create'],
		['PATCH', '/permissions/x', 'access-control.screens', 'edit'],
		['DELETE', '/permissions/x', 'access-control.screens', 'delete'],
	]

	runScreenGuardBattery(app, routes, () => fixtures)
})
