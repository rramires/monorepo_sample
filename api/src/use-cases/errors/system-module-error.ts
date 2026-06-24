export class SystemModuleError extends Error {
	constructor() {
		super('A system module cannot be modified that way.')
	}
}
