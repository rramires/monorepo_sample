import { AppError } from './app-error'

export class AccountInactiveError extends AppError {
	constructor() {
		super({
			code: 'account_inactive',
			httpStatus: 403,
			message: 'Account is inactive.',
		})
	}
}
