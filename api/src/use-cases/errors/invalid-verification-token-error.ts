import { AppError } from './app-error'

export class InvalidVerificationTokenError extends AppError {
	constructor() {
		super({
			code: 'invalid_verification_token',
			httpStatus: 400,
			message: 'Verification token is invalid or has already been used.',
		})
	}
}
