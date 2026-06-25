import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { PermissionInUseError } from '@/use-cases/errors/permission-in-use-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { SystemPermissionError } from '@/use-cases/errors/system-permission-error'
import { makePermissionsUseCase } from '@/use-cases/factories/make-permissions-use-case'

// DELETE /permissions/:id — no cascade: blocked while granted to any profile.
export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({ id: z.string() })
	const { id } = paramsSchema.parse(request.params)

	const permissionsUseCase = makePermissionsUseCase()
	try {
		await permissionsUseCase.remove(id)
		return reply.status(204).send()
	} catch (err) {
		if (err instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: err.message })
		}
		if (
			err instanceof SystemPermissionError ||
			err instanceof PermissionInUseError
		) {
			return reply.status(409).send({ message: err.message })
		}
		throw err
	}
}
