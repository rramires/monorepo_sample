import { AppError } from './app-error'

export class ResendCooldownError extends AppError {
	constructor(retryAfterSeconds: number) {
		super({
			code: 'resend_cooldown',
			httpStatus: 429,
			message: 'Please wait before requesting another verification email.',
			meta: { retryAfter: retryAfterSeconds },
		})
	}
}
