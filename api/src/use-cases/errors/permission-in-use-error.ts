import { AppError } from './app-error'

// A permission granted to N profiles can't be deleted (no cascade) — mirrors the MSW message verbatim.
export class PermissionInUseError extends AppError {
	constructor(count: number) {
		super({
			code: 'permission_in_use',
			httpStatus: 409,
			message: `Granted to ${count} profile(s). Remove it from those profiles first.`,
			meta: { count },
		})
	}
}
