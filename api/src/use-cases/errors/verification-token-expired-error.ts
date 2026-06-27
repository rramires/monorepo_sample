import { AppError } from './app-error'

export class VerificationTokenExpiredError extends AppError {
	constructor() {
		super({
			code: 'verification_token_expired',
			httpStatus: 410,
			message: 'Verification token has expired.',
		})
	}
}
