import { z } from 'zod'

// Shared error contract. The backend returns a stable `code` per failure (plus
// optional `meta`); the frontend maps `code` -> localized text. `message` is an
// English dev fallback only — never shown to users when a code is present.
//
// Codes are `snake_case` (the wire convention) and one per error class; generic
// classes stay generic (`resource_not_found` / `unauthorized` / `forbidden` /
// `validation_error`). Keep this list in lock-step with the backend error
// classes and the frontend `errors` i18n namespace (keys === codes verbatim).
export const ERROR_CODES = [
	// auth / account
	'invalid_credentials',
	'account_inactive',
	'too_many_login_attempts',
	'email_already_exists',
	'invalid_reset_token',
	'reset_token_expired',
	'invalid_verification_token',
	'verification_token_expired',
	'email_already_verified',
	'resend_cooldown',
	'email_not_verified',
	// check-ins / gyms
	'max_distance',
	'gym_inactive',
	'max_check_ins_reached',
	'late_check_in_validation',
	// modules
	'system_module',
	'module_has_screens',
	// permissions
	'duplicate_permission_action',
	'system_permission',
	'permission_in_use',
	// profiles
	'default_profile_required',
	'system_profile',
	'profile_in_use',
	// screens
	'invalid_landing_screen',
	'system_screen',
	'screen_in_use',
	// users (self-guards)
	'cannot_change_own_role',
	'cannot_deactivate_self',
	// generic
	'resource_not_found',
	'unauthorized',
	'forbidden',
	// framework / handler
	'validation_error',
	'rate_limited',
	'payload_too_large',
	'server_under_pressure',
	'bad_request',
	'internal_server_error',
] as const

export const errorCodeSchema = z.enum(ERROR_CODES)
export type ErrorCode = z.infer<typeof errorCodeSchema>

// Dynamic data for interpolated messages. `retryAfter` is seconds (login lockout
// / resend cooldown); `count` is an in-use referent count (deletes blocked by N
// usages); `action` is a duplicate permission action key. All optional.
export const errorMetaSchema = z.object({
	retryAfter: z.number().optional(),
	count: z.number().optional(),
	action: z.string().optional(),
})
export type ErrorMeta = z.infer<typeof errorMetaSchema>

// Uniform error envelope sent by the central error handler. `issues` is present
// only for `validation_error` (Zod): an array of `{ path, message }` in
// production or a treeified error in development — kept loose on purpose.
export const errorResponseSchema = z.object({
	code: errorCodeSchema,
	message: z.string(),
	meta: errorMetaSchema.optional(),
	issues: z.unknown().optional(),
})
export type ErrorResponse = z.infer<typeof errorResponseSchema>
