import { FastifyRequest } from 'fastify'

import { env } from '@/env'
import { verifiedCache } from '@/lib/verified-cache'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'
import { EmailNotVerifiedError } from '@/use-cases/errors/email-not-verified-error'
import { UnauthorizedError } from '@/use-cases/errors/unauthorized-error'

// Stateless repository instance — only issues DB reads.
const usersRepository = new PrismaUsersRepository()

// Blocks unverified users when REQUIRE_EMAIL_VERIFICATION=true. Reads the real
// verification state from the database (through verifiedCache) rather than from
// a stale JWT claim, so a user who verifies mid-session is unblocked at once.
// Add this to any route that should require a verified email address.
export async function verifyEmailVerified(request: FastifyRequest) {
	if (!env.REQUIRE_EMAIL_VERIFICATION) {
		return
	}

	let isVerified = verifiedCache.get(request.user.sub)
	if (isVerified === undefined) {
		const user = await usersRepository.findById(request.user.sub)
		if (!user) {
			throw new UnauthorizedError()
		}
		isVerified = user.is_verified
		verifiedCache.set(request.user.sub, isVerified)
	}

	if (!isVerified) {
		throw new EmailNotVerifiedError()
	}
}
