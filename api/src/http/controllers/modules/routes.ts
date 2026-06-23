import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { listController } from './list-controller'
import { updateController } from './update-controller'

export async function modulesRoutes(app: FastifyInstance) {
	/**
	 * Authenticated routes
	 */
	app.addHook('onRequest', verifyJwtMiddleware)
	//
	app.get(
		'/modules',
		{ onRequest: [requireScreen('access-control.modules', 'view')] },
		listController,
	)
	//
	app.post(
		'/modules',
		{ onRequest: [requireScreen('access-control.modules', 'create')] },
		createController,
	)
	//
	app.patch(
		'/modules/:id',
		{ onRequest: [requireScreen('access-control.modules', 'edit')] },
		updateController,
	)
	//
	app.delete(
		'/modules/:id',
		{ onRequest: [requireScreen('access-control.modules', 'delete')] },
		deleteController,
	)
}
