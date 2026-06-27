import { AppError } from './app-error'

export class UnauthorizedError extends AppError {
	constructor() {
		super({
			code: 'unauthorized',
			httpStatus: 401,
			message: 'Unauthorized.',
		})
	}
}
