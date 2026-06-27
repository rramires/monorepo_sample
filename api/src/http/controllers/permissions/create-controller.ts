import { createPermissionBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

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
	const permission = await permissionsUseCase.create(screenId, body)
	return reply.status(201).send({ permission })
}
