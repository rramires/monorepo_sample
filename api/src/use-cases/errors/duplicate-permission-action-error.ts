import { AppError } from './app-error'

// UNIQUE(screen_id, action): a screen offers each op at most once.
export class DuplicatePermissionActionError extends AppError {
	constructor(action: string) {
		super({
			code: 'duplicate_permission_action',
			httpStatus: 409,
			message: `This screen already has a "${action}" permission.`,
			meta: { action },
		})
	}
}
