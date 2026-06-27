import { AppError } from './app-error'

export class TooManyAttemptsError extends AppError {
	constructor(retryAfterSeconds: number) {
		super({
			code: 'too_many_login_attempts',
			httpStatus: 429,
			message: 'Too many login attempts. Please try again later.',
			meta: { retryAfter: retryAfterSeconds },
		})
	}
}
