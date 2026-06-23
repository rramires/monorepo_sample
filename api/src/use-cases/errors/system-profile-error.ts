export class SystemProfileError extends Error {
	constructor() {
		super('A system profile cannot be modified that way.')
	}
}
