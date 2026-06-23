import { createProfileBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeProfilesUseCase } from '@/use-cases/factories/make-profiles-use-case'

export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const body = createProfileBodySchema.parse(request.body)

	const profilesUseCase = makeProfilesUseCase()
	const profile = await profilesUseCase.create(body)

	return reply.status(201).send({
		profile,
	})
}
