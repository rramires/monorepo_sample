// UNIQUE(screen_id, action): a screen offers each op at most once.
export class DuplicatePermissionActionError extends Error {
	constructor(action: string) {
		super(`This screen already has a "${action}" permission.`)
	}
}
