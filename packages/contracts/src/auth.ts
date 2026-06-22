import { z } from 'zod'

import { identifierSchema } from './primitives'

// POST /auth/login
export const loginBodySchema = z.object({
	identifier: identifierSchema,
	password: z.string().min(1).max(72),
})
export type LoginBody = z.infer<typeof loginBodySchema>

// 200 response carrying the access token (refresh lives in an httpOnly cookie).
export const authTokenResponseSchema = z.object({ token: z.string() })
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>
