export class SystemScreenError extends Error {
	constructor() {
		super('A system screen cannot be modified that way.')
	}
}
