import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ProfileInUseError } from '@/use-cases/errors/profile-in-use-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemProfileError } from '@/use-cases/errors/system-profile-error'
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
	try {
		await profilesUseCase.remove(id)

		return reply.status(204).send()
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (
			err instanceof SystemProfileError ||
			err instanceof ProfileInUseError
		) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
