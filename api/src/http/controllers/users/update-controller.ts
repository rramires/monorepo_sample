import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { env } from '@/env'
import { verifiedCache } from '@/lib/verified-cache'
import { makeUpdateUserUseCase } from '@/use-cases/factories/make-update-user-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		userId: z.uuid(),
	})
	const { userId } = paramsSchema.parse(request.params)

	// Admin whitelist. `.strict()` blocks unknown keys; the first refine forces
	// at least one field; the second forbids verifying a brand-new email in the
	// same call (a changed email is unproven, so is_verified must stay/become
	// false — it would be contradictory to set it true here).
	const bodySchema = z
		.object({
			username: z
				.string()
				.min(env.MIN_TEXT_LENGTH)
				.max(30)
				.regex(/^[a-zA-Z0-9_]+$/, 'letters, numbers, underscore only')
				.transform((s) => s.toLowerCase())
				.optional(),
			email: z.email().optional(),
			role: z.enum(['ADMIN', 'USER']).optional(),
			is_verified: z.boolean().optional(),
			is_active: z.boolean().optional(),
		})
		.strict()
		.refine(
			(data) =>
				data.username !== undefined ||
				data.email !== undefined ||
				data.role !== undefined ||
				data.is_verified !== undefined ||
				data.is_active !== undefined,
			{ message: 'Provide at least one field to update.' },
		)
		.refine(
			(data) => !(data.email !== undefined && data.is_verified === true),
			{
				message:
					'Cannot verify a newly-changed email in the same request.',
			},
		)
	const { username, email, role, is_verified, is_active } = bodySchema.parse(
		request.body,
	)

	const updateUserUseCase = makeUpdateUserUseCase()
	const { user, verifiedCacheStale } = await updateUserUseCase.execute({
		actorId: request.user.sub,
		userId,
		username,
		email,
		role,
		is_verified,
		is_active,
	})

	// Drop the cached verification status so the middleware re-reads the DB.
	if (verifiedCacheStale) {
		verifiedCache.invalidate(userId)
	}

	return reply.status(200).send({ user })
}
