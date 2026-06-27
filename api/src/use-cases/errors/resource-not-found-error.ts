import { AppError } from './app-error'

export class ResourceNotFoundError extends AppError {
	constructor() {
		super({
			code: 'resource_not_found',
			httpStatus: 404,
			message: 'Resource not found.',
		})
	}
}
