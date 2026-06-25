import { updatePermissionBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { DuplicatePermissionActionError } from '@/use-cases/errors/duplicate-permission-action-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemPermissionError } from '@/use-cases/errors/system-permission-error'
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
	try {
		const permission = await permissionsUseCase.update(id, body)
		return reply.send({ permission })
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (
			err instanceof SystemPermissionError ||
			err instanceof DuplicatePermissionActionError
		) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
