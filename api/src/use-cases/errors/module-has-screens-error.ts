export class ModuleHasScreensError extends Error {
	constructor() {
		super('Module still has screens.')
	}
}
