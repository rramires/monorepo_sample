import { AppError } from './app-error'

export class LateCheckInValidationError extends AppError {
	constructor() {
		super({
			code: 'late_check_in_validation',
			httpStatus: 409,
			message: 'The check-in can only be validated until 20 minutes of its creation.',
		})
	}
}
