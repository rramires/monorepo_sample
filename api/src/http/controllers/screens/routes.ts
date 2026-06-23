import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { listController } from './list-controller'
import { updateController } from './update-controller'

const SCREEN_KEY = 'access-control.screens'

export async function screensRoutes(app: FastifyInstance) {
	/**
	 * Authenticated routes
	 */
	app.addHook('onRequest', verifyJwtMiddleware)
	//
	app.get(
		'/screens',
		{ onRequest: [requireScreen(SCREEN_KEY, 'view')] },
		listController,
	)
	//
	app.post(
		'/screens',
		{ onRequest: [requireScreen(SCREEN_KEY, 'create')] },
		createController,
	)
	//
	app.patch(
		'/screens/:id',
		{ onRequest: [requireScreen(SCREEN_KEY, 'edit')] },
		updateController,
	)
	//
	app.delete(
		'/screens/:id',
		{ onRequest: [requireScreen(SCREEN_KEY, 'delete')] },
		deleteController,
	)
}
