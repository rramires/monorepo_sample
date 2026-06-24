export class InactiveGymError extends Error {
	constructor() {
		super('Gym is inactive.')
	}
}
