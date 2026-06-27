import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeProfilesUseCase } from '@/use-cases/factories/make-profiles-use-case'

export async function getController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.uuid(),
	})
	const { id } = paramsSchema.parse(request.params)

	const profilesUseCase = makeProfilesUseCase()
	const detail = await profilesUseCase.getDetail(id)

	// The ProfileDetail object is sent directly (not wrapped).
	return reply.send(detail)
}
