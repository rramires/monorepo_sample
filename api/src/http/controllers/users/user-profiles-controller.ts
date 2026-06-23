import { assignUserProfilesBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { makeUserProfilesUseCase } from '@/use-cases/factories/make-user-profiles-use-case'

const paramsSchema = z.object({ userId: z.string() })

export async function getUserProfilesController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { userId } = paramsSchema.parse(request.params)
	const useCase = makeUserProfilesUseCase()

	try {
		const { profileIds } = await useCase.getForUser(userId)
		return reply.status(200).send({ profile_ids: profileIds })
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		throw err
	}
}

export async function setUserProfilesController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { userId } = paramsSchema.parse(request.params)
	const { profile_ids } = assignUserProfilesBodySchema.parse(request.body)
	const useCase = makeUserProfilesUseCase()

	try {
		const { profileIds } = await useCase.setForUser(userId, profile_ids)
		return reply.status(200).send({ profile_ids: profileIds })
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		throw err
	}
}
