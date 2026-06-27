import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function deleteController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		noticeId: z.uuid(),
	})
	const { noticeId } = paramsSchema.parse(request.params)

	const noticesUseCase = makeNoticesUseCase()
	await noticesUseCase.remove(noticeId)

	return reply.status(204).send()
}
