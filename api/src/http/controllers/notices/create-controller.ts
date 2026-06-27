import { createNoticeBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function createController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const body = createNoticeBodySchema.parse(request.body)

	const noticesUseCase = makeNoticesUseCase()
	const notice = await noticesUseCase.create(body)

	return reply.status(201).send({
		notice,
	})
}
