export interface IUserProfilesRepository {
	// Profile ids assigned to a user.
	listByUser(userId: string): Promise<string[]>
	// Replace a user's assignments wholesale; returns the persisted ids.
	setForUser(userId: string, profileIds: string[]): Promise<string[]>
	// Attach the is_default profile to a user (no-op if none exists or already
	// attached). Used by POST /register.
	attachDefault(userId: string): Promise<void>
}
