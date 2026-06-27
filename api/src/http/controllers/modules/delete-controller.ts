import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

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
	await modulesUseCase.remove(id)

	return reply.status(204).send()
}
