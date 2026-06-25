// A profile assigned to N users can't be deleted (no cascade) — mirrors the MSW message verbatim.
export class ProfileInUseError extends Error {
	constructor(count: number) {
		super(
			`Assigned to ${count} user(s). Unassign it from those users first.`,
		)
	}
}
