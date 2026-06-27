import { FastifyRequest } from 'fastify'

import { passwordChangedRegistry } from '@/lib/password-changed-registry'
import { tokenDenylist } from '@/lib/token-denylist'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { UnauthorizedError } from '@/use-cases/errors/unauthorized-error'

// Stateless repository instance — only issues DB reads.
const usersRepository = new PrismaUsersRepository()

export async function verifyJwtMiddleware(request: FastifyRequest) {
	try {
		await request.jwtVerify()
	} catch {
		throw new UnauthorizedError()
	}

	// Reject tokens that were explicitly revoked (e.g. via logout).
	if (await tokenDenylist.isRevoked(request.user.jti)) {
		throw new UnauthorizedError()
	}

	// Reject every token issued before the user's last password change (global
	// logout after a password reset).
	if (
		await passwordChangedRegistry.isInvalidated(
			request.user.sub,
			request.user.iat,
		)
	) {
		throw new UnauthorizedError()
	}

	// Reject deactivated accounts on their very next request (read fresh from the
	// DB, never the JWT) — a fired user is cut off immediately, not when the
	// token expires. Also covers a deleted user (no row → unauthorized).
	const user = await usersRepository.findById(request.user.sub)
	if (!user || !user.is_active) {
		throw new UnauthorizedError()
	}
}
