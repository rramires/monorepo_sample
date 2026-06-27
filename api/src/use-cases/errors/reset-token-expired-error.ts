import { AppError } from './app-error'

export class ResetTokenExpiredError extends AppError {
	constructor() {
		super({
			code: 'reset_token_expired',
			httpStatus: 410,
			message: 'Reset token expired.',
		})
	}
}
