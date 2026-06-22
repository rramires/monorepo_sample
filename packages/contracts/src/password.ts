import { z } from 'zod'

// The password rule is parameterized by env (PASSWORD_* on the backend,
// VITE_PASSWORD_* on the frontend): same shape, each side injects its own
// values. The factory keeps env OUT of this module's import-time evaluation.
export interface PasswordPolicy {
	min: number
	pattern: RegExp
	message?: string
}

export function makePasswordSchema({ min, pattern, message }: PasswordPolicy) {
	return (
		z
			.string()
			.min(min)
			.max(72) // bcrypt input ceiling, in characters
			.regex(pattern, message ?? 'Password does not meet the complexity policy')
			// bcrypt truncates past 72 *bytes*; TextEncoder works in Node and the
			// browser, so the same check runs on both sides.
			.refine((value) => new TextEncoder().encode(value).length <= 72, {
				message: 'Password is too long.',
			})
	)
}
