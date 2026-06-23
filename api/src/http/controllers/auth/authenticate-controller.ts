import { randomUUID } from 'node:crypto'

import { loginBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'

import { env } from '@/env'
import { AccountInactiveError } from '@/use-cases/errors/account-inactive-error'
import { InvalidCredentialsError } from '@/use-cases/errors/invalid-credentials-error'
import { TooManyAttemptsError } from '@/use-cases/errors/too-many-attempts-error'
import { makeAuthenticateUseCase } from '@/use-cases/factories/make-authenticate-use-case'

export async function authenticateController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	// Shape shared with the frontend (identifier = email or username).
	const { identifier, password } = loginBodySchema.parse(request.body)

	try {
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
		//
	} catch (err) {
		if (err instanceof TooManyAttemptsError) {
			// 429 Too Many Requests
			return reply.status(429).send({
				message: err.message,
				retryAfter: env.LOGIN_LOCKOUT_MINUTES * 60,
			})
		}
		if (err instanceof InvalidCredentialsError) {
			// 401 Unauthorized
			return reply.status(401).send({ message: err.message })
		}
		if (err instanceof AccountInactiveError) {
			// 403 Forbidden — valid credentials, but the account is disabled.
			return reply.status(403).send({ message: err.message })
		}
		// Other unspecified errors (Fastify capture this)
		throw err
	}
}
