import { createModuleBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeModulesUseCase } from '@/use-cases/factories/make-modules-use-case'

export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const body = createModuleBodySchema.parse(request.body)

	const modulesUseCase = makeModulesUseCase()
	const module = await modulesUseCase.create(body)

	return reply.status(201).send({
		module,
	})
}
