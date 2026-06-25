export class SystemProfileError extends Error {
	constructor(message = 'A system profile cannot be modified that way.') {
		super(message)
	}
}
