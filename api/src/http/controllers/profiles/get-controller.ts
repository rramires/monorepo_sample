import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
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
	try {
		const detail = await profilesUseCase.getDetail(id)

		// The ProfileDetail object is sent directly (not wrapped).
		return reply.send(detail)
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		throw err
	}
}
