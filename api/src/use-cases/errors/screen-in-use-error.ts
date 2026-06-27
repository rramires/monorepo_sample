import { AppError } from './app-error'

// A screen assigned to N profiles can't be deleted (no cascade) — mirrors the MSW message verbatim.
export class ScreenInUseError extends AppError {
	constructor(count: number) {
		super({
			code: 'screen_in_use',
			httpStatus: 409,
			message: `Assigned to ${count} profile(s). Remove it from those profiles first.`,
			meta: { count },
		})
	}
}
