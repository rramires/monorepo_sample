import { FastifyReply, FastifyRequest } from 'fastify'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { UnauthorizedError } from '@/use-cases/errors/unauthorized-error'
import { makeGetUserPermissionsUseCase } from '@/use-cases/factories/make-get-user-permissions-use-case'

// GET /me/permissions — the authenticated user's effective permissions, the
// same shape the frontend `can()` helper consumes. ADMIN gets every screen.
export async function permissionsController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const getUserPermissions = makeGetUserPermissionsUseCase()

	try {
		const { role, screens, menu, default_screen_key } =
			await getUserPermissions.execute({
				userId: request.user.sub,
			})
		return reply
			.status(200)
			.send({ role, screens, menu, default_screen_key })
	} catch (err) {
		// Valid token but the user no longer exists: force re-authentication.
		if (err instanceof ResourceNotFoundError) {
			throw new UnauthorizedError()
		}
		throw err
	}
}
