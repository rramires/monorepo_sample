import { z } from 'zod'

import { roleSchema } from './primitives'

// Wire response DTO (snake_case). e.g. GET /auth/me -> { user: PublicUser }.
// Exposed as a schema so the frontend can `parse` responses (catching drift)
// and MSW can validate its mocks against the same contract.
export const publicUserSchema = z.object({
	id: z.string(),
	username: z.string(),
	is_verified: z.boolean(),
	role: roleSchema,
})
export type PublicUser = z.infer<typeof publicUserSchema>

export const userResponseSchema = z.object({ user: publicUserSchema })
export type UserResponse = z.infer<typeof userResponseSchema>
