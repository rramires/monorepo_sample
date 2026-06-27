import { AppError } from './app-error'

// A profile assigned to N users can't be deleted (no cascade) — mirrors the MSW message verbatim.
export class ProfileInUseError extends AppError {
	constructor(count: number) {
		super({
			code: 'profile_in_use',
			httpStatus: 409,
			message: `Assigned to ${count} user(s). Unassign it from those users first.`,
			meta: { count },
		})
	}
}
