import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ModuleHasScreensError } from '@/use-cases/errors/module-has-screens-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { makeModulesUseCase } from '@/use-cases/factories/make-modules-use-case'

export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.uuid(),
	})
	const { id } = paramsSchema.parse(request.params)

	const modulesUseCase = makeModulesUseCase()
	try {
		await modulesUseCase.remove(id)

		return reply.status(204).send()
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (err instanceof ModuleHasScreensError) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
