import { AppError } from './app-error'

export class CannotDeactivateSelfError extends AppError {
	constructor() {
		super({
			code: 'cannot_deactivate_self',
			httpStatus: 400,
			message: 'You cannot deactivate your own account.',
		})
	}
}
