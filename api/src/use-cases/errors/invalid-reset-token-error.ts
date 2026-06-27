import { AppError } from './app-error'

export class InvalidResetTokenError extends AppError {
	constructor() {
		super({
			code: 'invalid_reset_token',
			httpStatus: 400,
			message: 'Invalid or expired reset token.',
		})
	}
}
