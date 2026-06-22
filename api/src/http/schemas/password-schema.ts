import { makePasswordSchema } from '@root/contracts'

import { env } from '@/env'

// Shared request password schema for register + reset, so the two never drift.
// The shape lives in @root/contracts (shared with the frontend); here we inject
// the backend's env-driven policy: length from PASSWORD_MIN_LENGTH, complexity
// from PASSWORD_PATTERN. The factory also enforces the 72-byte bcrypt ceiling.
export const passwordSchema = makePasswordSchema({
	min: env.PASSWORD_MIN_LENGTH,
	pattern: env.PASSWORD_PATTERN,
})
