import { AppError } from './app-error'

export class SystemModuleError extends AppError {
	constructor(message = 'A system module cannot be modified that way.') {
		super({ code: 'system_module', httpStatus: 409, message })
	}
}
