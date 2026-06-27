import { assignUserProfilesBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeUserProfilesUseCase } from '@/use-cases/factories/make-user-profiles-use-case'

const paramsSchema = z.object({ userId: z.string() })

export async function getUserProfilesController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { userId } = paramsSchema.parse(request.params)
	const useCase = makeUserProfilesUseCase()

	const { profileIds } = await useCase.getForUser(userId)
	return reply.status(200).send({ profile_ids: profileIds })
}

export async function setUserProfilesController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { userId } = paramsSchema.parse(request.params)
	const { profile_ids } = assignUserProfilesBodySchema.parse(request.body)
	const useCase = makeUserProfilesUseCase()

	const { profileIds } = await useCase.setForUser(userId, profile_ids)
	return reply.status(200).send({ profile_ids: profileIds })
}
