import { createPermissionBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { DuplicatePermissionActionError } from '@/use-cases/errors/duplicate-permission-action-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { makePermissionsUseCase } from '@/use-cases/factories/make-permissions-use-case'

// POST /screens/:screenId/permissions — add one curated op to a screen.
export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({ screenId: z.string() })
	const { screenId } = paramsSchema.parse(request.params)

	const body = createPermissionBodySchema.parse(request.body)

	const permissionsUseCase = makePermissionsUseCase()
	try {
		const permission = await permissionsUseCase.create(screenId, body)
		return reply.status(201).send({ permission })
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (err instanceof DuplicatePermissionActionError) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
