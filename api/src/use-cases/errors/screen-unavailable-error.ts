import { AppError } from './app-error'

export class ScreenUnavailableError extends AppError {
	constructor() {
		super({
			code: 'screen_unavailable',
			httpStatus: 403,
			message: 'This screen is temporarily unavailable.',
		})
	}
}
