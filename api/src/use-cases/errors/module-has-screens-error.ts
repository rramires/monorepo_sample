import { AppError } from './app-error'

export class ModuleHasScreensError extends AppError {
	constructor() {
		super({
			code: 'module_has_screens',
			httpStatus: 409,
			message: 'Module still has screens.',
		})
	}
}
