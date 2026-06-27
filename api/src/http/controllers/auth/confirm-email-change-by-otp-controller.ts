import { otpCodeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { verifiedCache } from '@/lib/verified-cache'
import { makeConfirmEmailChangeUseCase } from '@/use-cases/factories/make-confirm-email-change-use-case'

export async function confirmEmailChangeByOtpController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { code } = otpCodeBodySchema.parse(request.body)

	const useCase = makeConfirmEmailChangeUseCase()
	const { userId } = await useCase.execute({
		userId: request.user.sub,
		code,
	})
	// Confirming proves the new address → account is verified again.
	verifiedCache.set(userId, true)
	return reply.status(204).send()
}
