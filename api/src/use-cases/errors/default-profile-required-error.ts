import { AppError } from './app-error'

export class DefaultProfileRequiredError extends AppError {
	constructor() {
		super({
			code: 'default_profile_required',
			httpStatus: 409,
			message: 'At least one profile must remain the default.',
		})
	}
}
