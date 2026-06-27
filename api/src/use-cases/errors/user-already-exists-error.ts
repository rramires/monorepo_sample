import { AppError } from './app-error'

export class UserAlreadyExistsError extends AppError {
	constructor() {
		super({
			code: 'email_already_exists',
			httpStatus: 409,
			message: 'E-mail already exists.',
		})
	}
}
