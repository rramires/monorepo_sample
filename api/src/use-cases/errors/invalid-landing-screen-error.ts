import { AppError } from './app-error'

// The profile's landing screen must be one of its assigned, viewable screens.
export class InvalidLandingScreenError extends AppError {
	constructor() {
		super({
			code: 'invalid_landing_screen',
			httpStatus: 400,
			message: 'The landing screen must be an assigned, viewable screen.',
		})
	}
}
