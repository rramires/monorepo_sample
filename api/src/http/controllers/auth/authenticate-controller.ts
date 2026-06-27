import { randomUUID } from 'node:crypto'

import { loginBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { makeAuthenticateUseCase } from '@/use-cases/factories/make-authenticate-use-case'

export async function authenticateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Shape shared with the frontend (identifier = email or username).
	const { identifier, password } = loginBodySchema.parse(request.body)

	const authenticateUseCase = makeAuthenticateUseCase()
	const { user } = await authenticateUseCase.execute({
		identifier,
		password,
	})
	// JWT
	const token = await reply.jwtSign(
		{
			role: user.role,
			// jti enables per-token revocation via the denylist.
			jti: randomUUID(),
		},
		{
			sign: {
				sub: user.id,
			},
		},
	)
	//
	const refreshToken = await reply.jwtSign(
		{
			role: user.role,
			jti: randomUUID(),
		},
		{
			sign: {
				sub: user.id,
				expiresIn: '7d',
			},
		},
	)
	return reply
		.status(200)
		.setCookie('refreshToken', refreshToken, {
			path: '/',
			secure: true,
			sameSite: true,
			httpOnly: true,
		})
		.send({
			token,
		})
}
