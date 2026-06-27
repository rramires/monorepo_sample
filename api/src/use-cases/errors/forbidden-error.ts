import { AppError } from './app-error'

export class ForbiddenError extends AppError {
	constructor() {
		super({
			code: 'forbidden',
			httpStatus: 403,
			message: 'Forbidden.',
		})
	}
}
