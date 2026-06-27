import { FastifyReply, FastifyRequest } from 'fastify'

import { makeNoticesUseCase } from '@/use-cases/factories/make-notices-use-case'

export async function listController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const noticesUseCase = makeNoticesUseCase()
	const notices = await noticesUseCase.list()

	return reply.send({
		notices,
	})
}
