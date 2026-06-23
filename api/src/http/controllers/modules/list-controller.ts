import { FastifyReply, FastifyRequest } from 'fastify'

import { makeModulesUseCase } from '@/use-cases/factories/make-modules-use-case'

export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const modulesUseCase = makeModulesUseCase()
	const modules = await modulesUseCase.list()

	return reply.send({
		modules,
	})
}
