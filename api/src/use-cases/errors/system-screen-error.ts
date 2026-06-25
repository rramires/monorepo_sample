export class SystemScreenError extends Error {
	constructor(message = 'A system screen cannot be modified that way.') {
		super(message)
	}
}
