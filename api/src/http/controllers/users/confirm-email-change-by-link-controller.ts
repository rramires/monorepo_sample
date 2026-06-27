import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { verifiedCache } from '@/lib/verified-cache'
import { makeConfirmEmailChangeUseCase } from '@/use-cases/factories/make-confirm-email-change-use-case'

export async function confirmEmailChangeByLinkController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Public — the link carries the proof (the unguessable token), so no JWT.
	const querySchema = z.object({
		token: z.uuid(),
	})
	const { token } = querySchema.parse(request.query)

	const useCase = makeConfirmEmailChangeUseCase()
	const { userId } = await useCase.execute({ token })
	verifiedCache.set(userId, true)
	return reply.status(204).send()
}
