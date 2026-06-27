import { updateProfileBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeProfilesUseCase } from '@/use-cases/factories/make-profiles-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.uuid(),
	})
	const { id } = paramsSchema.parse(request.params)

	const body = updateProfileBodySchema.parse(request.body)

	const profilesUseCase = makeProfilesUseCase()
	const profile = await profilesUseCase.update(id, body)

	return reply.send({
		profile,
	})
}
