export class SystemModuleError extends Error {
	constructor(message = 'A system module cannot be modified that way.') {
		super(message)
	}
}
