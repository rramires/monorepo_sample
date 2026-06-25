// Seeded permissions are protected: their action is the code contract and they can't be deleted.
export class SystemPermissionError extends Error {
	constructor(message = 'A system permission cannot be modified that way.') {
		super(message)
	}
}
