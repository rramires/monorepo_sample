export class DefaultProfileRequiredError extends Error {
	constructor() {
		super('At least one profile must remain the default.')
	}
}
