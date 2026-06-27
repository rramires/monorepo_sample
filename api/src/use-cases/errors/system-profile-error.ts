import { AppError } from './app-error'

export class SystemProfileError extends AppError {
	constructor(message = 'A system profile cannot be modified that way.') {
		super({ code: 'system_profile', httpStatus: 409, message })
	}
}
