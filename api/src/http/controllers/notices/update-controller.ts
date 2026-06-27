import { updateNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function updateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		noticeId: z.uuid(),
	})
	const { noticeId } = paramsSchema.parse(request.params)

	const body = updateNoticeBodySchema.parse(request.body)

	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.update(noticeId, body)

	return reply.send({
		notice,
	})
}
