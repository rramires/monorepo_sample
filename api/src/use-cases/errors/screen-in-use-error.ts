// A screen assigned to N profiles can't be deleted (no cascade) — mirrors the MSW message verbatim.
export class ScreenInUseError extends Error {
	constructor(count: number) {
		super(
			`Assigned to ${count} profile(s). Remove it from those profiles first.`,
		)
	}
}
