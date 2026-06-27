import { AppError } from './app-error'

export class AlreadyVerifiedError extends AppError {
	constructor() {
		super({
			code: 'email_already_verified',
			httpStatus: 409,
			message: 'Email is already verified.',
		})
	}
}
