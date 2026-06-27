import { FastifyInstance } from 'fastify'

import { requireScreen } from '@/http/middlewares/require-screen'
import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { createController } from './create-controller'
import { deleteController } from './delete-controller'
import { listController } from './list-controller'
import { updateController } from './update-controller'

export async function noticesRoutes(app: FastifyInstance) {
	app.addHook('onRequest', verifyJwtMiddleware)
	app.get(
		'/notices',
		{ onRequest: [requireScreen('notices.notices', 'view')] },
		listController,
	)
	app.post(
		'/notices',
		{ onRequest: [requireScreen('notices.notices', 'create')] },
		createController,
	)
	app.patch(
		'/notices/:noticeId',
		{ onRequest: [requireScreen('notices.notices', 'edit')] },
		updateController,
	)
	app.delete(
		'/notices/:noticeId',
		{ onRequest: [requireScreen('notices.notices', 'delete')] },
		deleteController,
	)
}
