import { otpCodeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { verifiedCache } from '@/lib/verified-cache'
import { makeVerifyEmailUseCase } from '@/use-cases/factories/make-verify-email-use-case'

export async function verifyEmailByLinkController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const querySchema = z.object({
		token: z.string().uuid(),
	})
	const { token } = querySchema.parse(request.query)

	const useCase = makeVerifyEmailUseCase()
	const { userId } = await useCase.execute({ token })
	// Refresh the read-through cache so the middleware unblocks immediately.
	verifiedCache.set(userId, true)
	return reply.status(204).send()
}

export async function verifyEmailByOtpController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { code } = otpCodeBodySchema.parse(request.body)

	const useCase = makeVerifyEmailUseCase()
	const { userId } = await useCase.execute({
		userId: request.user.sub,
		code,
	})
	// Refresh the read-through cache so the middleware unblocks immediately.
	verifiedCache.set(userId, true)
	return reply.status(204).send()
}
