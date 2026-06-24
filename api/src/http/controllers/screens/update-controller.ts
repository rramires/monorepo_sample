import { updateScreenBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemScreenError } from '@/use-cases/errors/system-screen-error'
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
	try {
		const screen = await screensUseCase.update(id, body)

		return reply.status(200).send({
			screen,
		})
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (err instanceof SystemScreenError) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
