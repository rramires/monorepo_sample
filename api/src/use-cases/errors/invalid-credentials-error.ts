import { AppError } from './app-error'

export class InvalidCredentialsError extends AppError {
	constructor() {
		super({
			code: 'invalid_credentials',
			httpStatus: 401,
			message: 'Invalid credentials.',
		})
	}
}
