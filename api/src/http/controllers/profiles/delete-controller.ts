import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeProfilesUseCase } from '@/use-cases/factories/make-profiles-use-case'

export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.uuid(),
	})
	const { id } = paramsSchema.parse(request.params)

	const profilesUseCase = makeProfilesUseCase()
	await profilesUseCase.remove(id)

	return reply.status(204).send()
}
