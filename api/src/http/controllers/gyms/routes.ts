import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { createController } from './create-controller'
import { nearbyController } from './nearby-controller'
import { searchController } from './search-controller'
import { updateController } from './update-controller'

export async function gymsRoutes(app: FastifyInstance) {
	/**
	 * Authenticated routes
	 */
	app.addHook('onRequest', verifyJwtMiddleware)
	//
	// Reads belong to the Gyms screen — guarded by its `view` grant + kill switch
	// (requireScreen reads both fresh from the DB), so a killed/ungranted screen
	// 403s on every route, not just the mutations.
	app.get(
		'/gyms/search',
		{ onRequest: [requireScreen('gym.gyms', 'view')] },
		searchController,
	)
	app.get(
		'/gyms/nearby',
		{ onRequest: [requireScreen('gym.gyms', 'view')] },
		nearbyController,
	)
	//
	app.post(
		'/gyms',
		{ onRequest: [requireScreen('gym.gyms', 'create')] },
		createController,
	)
	//
	app.patch(
		'/gyms/:gymId',
		{ onRequest: [requireScreen('gym.gyms', 'edit')] },
		updateController,
	)
}
