import { AppError } from './app-error'

export class MaxDistanceError extends AppError {
	constructor() {
		super({
			code: 'max_distance',
			httpStatus: 400,
			message: 'Max distance reached.',
		})
	}
}
