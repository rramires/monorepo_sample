import { AppError } from './app-error'

export class SystemScreenError extends AppError {
	constructor(message = 'A system screen cannot be modified that way.') {
		super({ code: 'system_screen', httpStatus: 409, message })
	}
}
