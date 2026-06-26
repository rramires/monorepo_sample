import { afterAll, beforeAll, describe } from 'vitest'

import { app } from '@/app'
import {
	type GuardFixtures,
	type GuardRoute,
	runScreenGuardBattery,
	seedScreenGuardFixtures,
} from '@/utils/tests/screen-guard-battery'

// Screen-guard battery — the gym module, including the cross-screen composed
// keys (create_checkin on gym.gyms, edit_validate on gym.check-ins) and the
// read routes that used to be open. Killing a screen must 403 every one.
describe('Screen guard — gym module (e2e)', () => {
	let fixtures: GuardFixtures

	beforeAll(async () => {
		await app.ready()
		fixtures = await seedScreenGuardFixtures(app, [
			{
				key: 'gym.dashboard',
				path: '/',
				actions: ['view'],
			},
			{
				key: 'gym.gyms',
				path: '/gyms',
				actions: ['view', 'create', 'edit', 'create_checkin'],
			},
			{
				key: 'gym.check-ins',
				path: '/check-ins',
				actions: ['view', 'edit_validate'],
			},
		])
	})

	afterAll(async () => {
		await app.close()
	})

	const routes: GuardRoute[] = [
		// gym.gyms — reads + mutations + the check-in composed key
		['GET', '/gyms/search', 'gym.gyms', 'view'],
		['GET', '/gyms/nearby', 'gym.gyms', 'view'],
		['POST', '/gyms', 'gym.gyms', 'create'],
		['PATCH', '/gyms/x', 'gym.gyms', 'edit'],
		['POST', '/gyms/x/check-ins', 'gym.gyms', 'create_checkin'],
		// gym.check-ins — history + the validate composed key
		['GET', '/check-ins/history', 'gym.check-ins', 'view'],
		['PATCH', '/check-ins/x/validate', 'gym.check-ins', 'edit_validate'],
		// gym.dashboard — metrics feed
		['GET', '/check-ins/metrics', 'gym.dashboard', 'view'],
	]

	runScreenGuardBattery(app, routes, () => fixtures)
})
