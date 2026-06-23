import { createScreenBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeScreensUseCase } from '@/use-cases/factories/make-screens-use-case'

export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const body = createScreenBodySchema.parse(request.body)

	const screensUseCase = makeScreensUseCase()
	const screen = await screensUseCase.create(body)

	return reply.status(201).send({
		screen,
	})
}
