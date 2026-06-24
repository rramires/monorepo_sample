import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemScreenError } from '@/use-cases/errors/system-screen-error'
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
	try {
		await screensUseCase.remove(id)

		return reply.status(204).send()
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
