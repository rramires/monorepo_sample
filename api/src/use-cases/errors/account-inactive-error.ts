export class AccountInactiveError extends Error {
	constructor() {
		super('Account is inactive.')
	}
}
