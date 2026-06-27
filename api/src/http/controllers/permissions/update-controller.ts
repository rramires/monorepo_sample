import { updatePermissionBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makePermissionsUseCase } from '@/use-cases/factories/make-permissions-use-case'

// PATCH /permissions/:id — rename and/or re-target an op.
export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({ id: z.string() })
	const { id } = paramsSchema.parse(request.params)

	const body = updatePermissionBodySchema.parse(request.body)

	const permissionsUseCase = makePermissionsUseCase()
	const permission = await permissionsUseCase.update(id, body)
	return reply.send({ permission })
}
