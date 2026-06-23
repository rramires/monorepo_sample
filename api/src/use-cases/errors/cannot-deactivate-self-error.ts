export class CannotDeactivateSelfError extends Error {
	constructor() {
		super('You cannot deactivate your own account.')
	}
}
