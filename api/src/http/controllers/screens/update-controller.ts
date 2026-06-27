import { updateScreenBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeScreensUseCase } from '@/use-cases/factories/make-screens-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.string(),
	})
	const { id } = paramsSchema.parse(request.params)

	const body = updateScreenBodySchema.parse(request.body)

	const screensUseCase = makeScreensUseCase()
	const screen = await screensUseCase.update(id, body)

	return reply.status(200).send({
		screen,
	})
}
