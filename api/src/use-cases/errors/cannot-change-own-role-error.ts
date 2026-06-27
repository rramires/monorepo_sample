import { AppError } from './app-error'

export class CannotChangeOwnRoleError extends AppError {
	constructor() {
		super({
			code: 'cannot_change_own_role',
			httpStatus: 400,
			message: 'You cannot change your own role.',
		})
	}
}
