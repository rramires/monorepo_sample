import { z } from 'zod'

import { makePasswordSchema, type PasswordPolicy } from './password'
import { emailSchema, roleSchema, usernameSchema } from './primitives'

// POST /users — register. Password is policy-driven, so this is a factory; the
// inferred type is stable regardless of the injected policy.
export function makeRegisterBodySchema(policy: PasswordPolicy) {
	return z.object({
		username: usernameSchema,
		email: emailSchema,
		password: makePasswordSchema(policy),
	})
}
export type RegisterBody = z.infer<ReturnType<typeof makeRegisterBodySchema>>

// PATCH /auth/me — self update (username and/or preferred landing screen).
export const updateMeBodySchema = z.object({
	username: usernameSchema.optional(),
	// The user's preferred landing screen key; null clears it.
	default_screen_key: z.string().nullish(),
})
export type UpdateMeBody = z.infer<typeof updateMeBodySchema>

// PATCH /users/:userId — admin update. The "at least one field" rule is a
// backend-local refinement (it owns the specific 400), so it is not baked here.
export const updateUserBodySchema = z.object({
	username: usernameSchema.optional(),
	email: emailSchema.optional(),
	role: roleSchema.optional(),
	is_verified: z.boolean().optional(),
	is_active: z.boolean().optional(),
})
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>

// POST /users/reset-password — reset via link token (UUID) or email + OTP.
export function makeResetPasswordBodySchema(policy: PasswordPolicy) {
	const newPassword = makePasswordSchema(policy)
	return z.union([
		z.object({ token: z.uuid(), newPassword }),
		z.object({
			email: emailSchema,
			code: z.string().length(6),
			newPassword,
		}),
	])
}
export type ResetPasswordBody = z.infer<
	ReturnType<typeof makeResetPasswordBodySchema>
>

// POST /auth/me/email — request an email change.
export const requestEmailChangeBodySchema = z.object({ email: emailSchema })
export type RequestEmailChangeBody = z.infer<
	typeof requestEmailChangeBodySchema
>

// POST /users/verify-email/otp and POST /auth/me/email/confirm — 6-digit code.
export const otpCodeBodySchema = z.object({ code: z.string().length(6) })
export type OtpCodeBody = z.infer<typeof otpCodeBodySchema>
