import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makePermissionsUseCase } from '@/use-cases/factories/make-permissions-use-case'

// GET /permissions?screen_id — the curated catalog (optionally one screen's).
export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const querySchema = z.object({ screen_id: z.string().optional() })
	const { screen_id } = querySchema.parse(request.query)

	const permissionsUseCase = makePermissionsUseCase()
	const permissions = await permissionsUseCase.list(screen_id)

	return reply.send({ permissions })
}
