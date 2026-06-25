// A permission granted to N profiles can't be deleted (no cascade) — mirrors the MSW message verbatim.
export class PermissionInUseError extends Error {
	constructor(count: number) {
		super(
			`Granted to ${count} profile(s). Remove it from those profiles first.`,
		)
	}
}
