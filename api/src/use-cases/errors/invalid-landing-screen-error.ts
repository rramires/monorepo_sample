// The profile's landing screen must be one of its assigned, viewable screens.
export class InvalidLandingScreenError extends Error {
	constructor() {
		super('The landing screen must be an assigned, viewable screen.')
	}
}
