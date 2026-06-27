import { AppError } from './app-error'

export class MaxCheckInsReachedError extends AppError {
	constructor() {
		super({
			code: 'max_check_ins_reached',
			httpStatus: 409,
			message: 'Max check-ins reached.',
		})
	}
}
