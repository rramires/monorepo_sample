import { requestEmailChangeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeRequestEmailChangeUseCase } from '@/use-cases/factories/make-request-email-change-use-case'

export async function requestEmailChangeController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Self-service: acts on request.user.sub. Confirmation goes to the new
	// address; the current email stays valid until it's confirmed (pattern A).
	const { email } = requestEmailChangeBodySchema.parse(request.body)

	const useCase = makeRequestEmailChangeUseCase()
	await useCase.execute({ userId: request.user.sub, newEmail: email })
	return reply.status(204).send()
}
