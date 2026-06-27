import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { passwordSchema } from '@/http/schemas/password-schema'
import { makeResetPasswordUseCase } from '@/use-cases/factories/make-reset-password-use-case'

export async function resetPasswordController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Two ways to reset: a link token (UUID) or an email + 6-digit OTP.
	const bodySchema = z.union([
		z.object({ token: z.uuid(), newPassword: passwordSchema }),
		z.object({
			email: z.email(),
			code: z.string().length(6),
			newPassword: passwordSchema,
		}),
	])
	const body = bodySchema.parse(request.body)

	const useCase = makeResetPasswordUseCase()
	await useCase.execute(body)
	return reply.status(204).send()
}
