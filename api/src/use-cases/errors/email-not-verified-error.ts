import { AppError } from './app-error'

export class EmailNotVerifiedError extends AppError {
	constructor() {
		super({
			code: 'email_not_verified',
			httpStatus: 403,
			message: 'Email not verified.',
		})
	}
}
