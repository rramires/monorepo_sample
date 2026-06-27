import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeGetUserUseCase } from '@/use-cases/factories/make-get-user-use-case'

export async function getUserController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Admin-only (guarded in routes). Invalid id → ZodError → 400 in the global
	// handler. Returns PublicUser (never password_hash), byte-identical to each
	// item of GET /users.
	const paramsSchema = z.object({
		userId: z.uuid(),
	})
	const { userId } = paramsSchema.parse(request.params)

	const getUserUseCase = makeGetUserUseCase()
	const { user } = await getUserUseCase.execute({ userId })

	return reply.status(200).send({ user })
}
