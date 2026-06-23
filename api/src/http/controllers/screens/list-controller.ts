import { listScreensQuerySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeScreensUseCase } from '@/use-cases/factories/make-screens-use-case'

export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { module_id } = listScreensQuerySchema.parse(request.query)

	const screensUseCase = makeScreensUseCase()
	const screens = await screensUseCase.list(module_id)

	return reply.send({
		screens,
	})
}
