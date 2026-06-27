import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makePermissionsUseCase } from '@/use-cases/factories/make-permissions-use-case'

// DELETE /permissions/:id — no cascade: blocked while granted to any profile.
export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({ id: z.string() })
	const { id } = paramsSchema.parse(request.params)

	const permissionsUseCase = makePermissionsUseCase()
	await permissionsUseCase.remove(id)
	return reply.status(204).send()
}
