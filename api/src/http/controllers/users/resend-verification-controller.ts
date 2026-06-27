import { FastifyReply, FastifyRequest } from 'fastify'

import { makeSendVerificationUseCase } from '@/use-cases/factories/make-send-verification-use-case'

export async function resendVerificationController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const useCase = makeSendVerificationUseCase()
	await useCase.execute({ userId: request.user.sub })
	return reply.status(204).send()
}
