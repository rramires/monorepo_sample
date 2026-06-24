import { updateModuleBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemModuleError } from '@/use-cases/errors/system-module-error'
import { makeModulesUseCase } from '@/use-cases/factories/make-modules-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.uuid(),
	})
	const { id } = paramsSchema.parse(request.params)

	const body = updateModuleBodySchema.parse(request.body)

	const modulesUseCase = makeModulesUseCase()
	try {
		const module = await modulesUseCase.update(id, body)

		return reply.send({
			module,
		})
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (err instanceof SystemModuleError) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
