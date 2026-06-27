import { FastifyRequest } from 'fastify'

import { Role } from '@/prisma-client/enums'
import { ForbiddenError } from '@/use-cases/errors/forbidden-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { UnauthorizedError } from '@/use-cases/errors/unauthorized-error'
import { makeGetUserProfileUseCase } from '@/use-cases/factories/make-get-user-profile-use-case'

function verifyUserRole(roleToVerify: Role) {
	// Authorization reads the role from the DATABASE (by the authenticated user's
	// id), never from the JWT `role` claim. A role change — e.g. an admin
	// demoting a user — therefore takes effect on the very next request instead
	// of lingering until the access token (and its rotating refresh token)
	// expires. Mirrors how the profile controller reads `is_verified`/`role`
	// fresh from the DB; the signed `role` claim is never trusted for access
	// control. Runs after verifyJwtMiddleware, so `request.user.sub` is set.
	return async (request: FastifyRequest) => {
		const getUserProfile = makeGetUserProfileUseCase()

		try {
			const { user } = await getUserProfile.execute({
				userId: request.user.sub,
			})

			if (user.role !== roleToVerify) {
				// Authenticated but lacking the required role: 403, not 401.
				throw new ForbiddenError()
			}
		} catch (err) {
			// Valid token but the user no longer exists: force re-auth.
			if (err instanceof ResourceNotFoundError) {
				throw new UnauthorizedError()
			}
			throw err
		}
	}
}

export { verifyUserRole }
