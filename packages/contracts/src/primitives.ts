import { z } from 'zod'

// Wire-level primitives shared by request/response schemas. These describe the
// shape on the wire (snake_case, backend-permissive) — UI-only refinements
// (lowercasing, confirm-password, English messages) stay local to each app.

// Backend accepts letters, digits and underscores; the frontend additionally
// lowercases before sending, but the wire contract is the permissive one.
export const usernameSchema = z
	.string()
	.min(3)
	.max(30)
	.regex(
		/^[a-zA-Z0-9_]+$/,
		'Username may only contain letters, numbers and underscores',
	)

// Login identifier is an email OR a username, so on the wire it is just a
// non-empty string.
export const identifierSchema = z.string().min(1)

export const emailSchema = z.email()

export const roleSchema = z.enum(['MEMBER', 'ADMIN'])

// Query-string pagination: params arrive as strings, so coerce to a positive int.
export const pageQuerySchema = z.coerce.number().int().min(1).default(1)
