import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { listController } from './list-controller'
import { updateController } from './update-controller'

// The curated permission catalog is managed from the Screens admin screen, so
// CRUD is gated by access-control.screens; reading the catalog (also needed by
// the Profiles editor) is gated by its `view`.
const SCREEN_KEY = 'access-control.screens'

export async function permissionsRoutes(app: FastifyInstance) {
	/**
	 * Authenticated routes
	 */
	app.addHook('onRequest', verifyJwtMiddleware)
	//
	app.get(
		'/permissions',
		{ onRequest: [requireScreen(SCREEN_KEY, 'view')] },
		listController,
	)
	//
	app.post(
		'/screens/:screenId/permissions',
		{ onRequest: [requireScreen(SCREEN_KEY, 'create')] },
		createController,
	)
	//
	app.patch(
		'/permissions/:id',
		{ onRequest: [requireScreen(SCREEN_KEY, 'edit')] },
		updateController,
	)
	//
	app.delete(
		'/permissions/:id',
		{ onRequest: [requireScreen(SCREEN_KEY, 'delete')] },
		deleteController,
	)
}
