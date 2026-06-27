import { AppError } from './app-error'

// Seeded permissions are protected: their action is the code contract and they can't be deleted.
export class SystemPermissionError extends AppError {
	constructor(message = 'A system permission cannot be modified that way.') {
		super({ code: 'system_permission', httpStatus: 409, message })
	}
}
