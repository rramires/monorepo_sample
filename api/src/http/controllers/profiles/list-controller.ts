import { FastifyReply, FastifyRequest } from 'fastify'

import { makeProfilesUseCase } from '@/use-cases/factories/make-profiles-use-case'

export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const profilesUseCase = makeProfilesUseCase()
	const profiles = await profilesUseCase.list()

	return reply.send({
		profiles,
	})
}
