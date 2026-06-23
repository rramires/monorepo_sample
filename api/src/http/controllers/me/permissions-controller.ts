import { FastifyReply, FastifyRequest } from 'fastify'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { makeGetUserPermissionsUseCase } from '@/use-cases/factories/make-get-user-permissions-use-case'

// GET /me/permissions — the authenticated user's effective permissions, the
// same shape the frontend `can()` helper consumes. ADMIN gets every screen.
export async function permissionsController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const getUserPermissions = makeGetUserPermissionsUseCase()

	try {
		const { role, screens } = await getUserPermissions.execute({
			userId: request.user.sub,
		})
		return reply.status(200).send({ role, screens })
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(401).send({ message: err.message })
		}
		throw err
	}
}
