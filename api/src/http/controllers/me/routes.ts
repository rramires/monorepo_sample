import { FastifyInstance } from 'fastify'

import { verifyJwtMiddleware } from '@/http/middlewares/verify-jwt-middleware'

import { permissionsController } from './permissions-controller'

export async function meRoutes(app: FastifyInstance) {
	app.addHook('onRequest', verifyJwtMiddleware)

	app.get('/me/permissions', permissionsController)
}
