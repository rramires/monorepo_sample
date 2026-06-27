import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeScreensUseCase } from '@/use-cases/factories/make-screens-use-case'

export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.string(),
	})
	const { id } = paramsSchema.parse(request.params)

	const screensUseCase = makeScreensUseCase()
	await screensUseCase.remove(id)

	return reply.status(204).send()
}
