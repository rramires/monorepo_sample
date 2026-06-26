import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyEmailVerified } from '@/http/middlewares/verify-email-verified'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { checkInController } from './check-in-controller'
import { historyController } from './history-controller'
import { metricsController } from './metrics-controller'
import { validateController } from './validate-controller'

export async function checkInsRoutes(app: FastifyInstance) {
	/**
	 * Authenticated routes
	 */
	app.addHook('onRequest', verifyJwtMiddleware)
	//
	// History is the Check-ins screen; metrics feed the Dashboard. Guard each by
	// its screen's `view` grant + kill switch (read fresh from the DB).
	app.get(
		'/check-ins/history',
		{ onRequest: [requireScreen('gym.check-ins', 'view')] },
		historyController,
	)
	app.get(
		'/check-ins/metrics',
		{ onRequest: [requireScreen('gym.dashboard', 'view')] },
		metricsController,
	)
	//
	// Check-in is an extra op of the Gyms screen (the button lives on /gyms), so
	// the action grant is gym.gyms.create_checkin. requireScreen reads the grant
	// AND the screen kill switch fresh from the DB each request — email-verify
	// runs first so an unverified user still gets that message.
	app.post(
		'/gyms/:gymId/check-ins',
		{
			onRequest: [
				verifyEmailVerified,
				requireScreen('gym.gyms', 'create_checkin'),
			],
		},
		checkInController,
	)
	//
	app.patch(
		'/check-ins/:checkInId/validate',
		{ onRequest: [requireScreen('gym.check-ins', 'edit_validate')] },
		validateController,
	)
}
