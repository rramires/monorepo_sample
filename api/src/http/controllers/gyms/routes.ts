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
	app.get('/gyms/search', searchController)
	app.get('/gyms/nearby', nearbyController)
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
