import { FastifyReply, FastifyRequest } from 'fastify'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { makeGetUserPermissionsUseCase } from '@/use-cases/factories/make-get-user-permissions-use-case'

export type ScreenAction = 'view' | 'create' | 'edit' | 'delete'

// Authorization guard: allows the request only when the authenticated user
// `can()` perform `action` on `screenKey`. Effective permissions are read from
// the DATABASE each request (never the JWT), so a grant/profile change takes
// effect on the very next request — mirrors verifyUserRole. ADMIN bypasses
// everything. Runs after verifyJwtMiddleware, so `request.user.sub` is set.
function requireScreen(screenKey: string, action: ScreenAction = 'view') {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const getUserPermissions = makeGetUserPermissionsUseCase()

		try {
			const { role, screens } = await getUserPermissions.execute({
				userId: request.user.sub,
			})

			if (role === 'ADMIN') {
				return
			}

			const screen = screens.find((s) => s.screen_key === screenKey)
			if (!screen?.[action]) {
				// Authenticated but lacking the grant: 403, not 401.
				return reply.status(403).send({ message: 'Forbidden.' })
			}
		} catch (err) {
			if (err instanceof ResourceNotFoundError) {
				return reply.status(401).send({ message: 'Unauthorized.' })
			}
			throw err
		}
	}
}

export { requireScreen }
