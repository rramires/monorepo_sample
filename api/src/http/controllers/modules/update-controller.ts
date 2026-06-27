import { updateModuleBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

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
	const module = await modulesUseCase.update(id, body)

	return reply.send({
		module,
	})
}
