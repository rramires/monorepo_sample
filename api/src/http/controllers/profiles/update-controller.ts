import { updateProfileBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { DefaultProfileRequiredError } from '@/use-cases/errors/default-profile-required-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemProfileError } from '@/use-cases/errors/system-profile-error'
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
	try {
		const profile = await profilesUseCase.update(id, body)

		return reply.send({
			profile,
		})
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (
			err instanceof SystemProfileError ||
			err instanceof DefaultProfileRequiredError
		) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
