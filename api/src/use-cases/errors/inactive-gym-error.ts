import { AppError } from './app-error'

export class InactiveGymError extends AppError {
	constructor() {
		super({
			code: 'gym_inactive',
			httpStatus: 403,
			message: 'Gym is inactive.',
		})
	}
}
