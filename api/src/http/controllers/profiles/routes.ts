import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { getController } from './get-controller'
import { listController } from './list-controller'
import { setScreensController } from './set-screens-controller'
import { updateController } from './update-controller'

export async function profilesRoutes(app: FastifyInstance) {
	/**
	 * Authenticated routes
	 */
	app.addHook('onRequest', verifyJwtMiddleware)
	//
	app.get(
		'/profiles',
		{ onRequest: [requireScreen('access-control.profiles', 'view')] },
		listController,
	)
	//
	app.get(
		'/profiles/:id',
		{ onRequest: [requireScreen('access-control.profiles', 'view')] },
		getController,
	)
	//
	app.post(
		'/profiles',
		{ onRequest: [requireScreen('access-control.profiles', 'create')] },
		createController,
	)
	//
	app.patch(
		'/profiles/:id',
		{ onRequest: [requireScreen('access-control.profiles', 'edit')] },
		updateController,
	)
	//
	app.delete(
		'/profiles/:id',
		{ onRequest: [requireScreen('access-control.profiles', 'delete')] },
		deleteController,
	)
	//
	app.put(
		'/profiles/:id/screens',
		{ onRequest: [requireScreen('access-control.profiles', 'edit')] },
		setScreensController,
	)
}
