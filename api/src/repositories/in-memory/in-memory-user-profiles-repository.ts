import type { IUserProfilesRepository } from '../i-user-profiles-repository'

// In-memory user↔profile assignments for unit tests. Set `defaultProfileId` to
// exercise attachDefault.
export class InMemoryUserProfilesRepository implements IUserProfilesRepository {
	public items: { user_id: string; profile_id: string }[] = []
	public defaultProfileId: string | null = null

	async listByUser(userId: string): Promise<string[]> {
		return this.items
			.filter((i) => i.user_id === userId)
			.map((i) => i.profile_id)
	}

	async setForUser(userId: string, profileIds: string[]): Promise<string[]> {
		this.items = this.items.filter((i) => i.user_id !== userId)
		for (const profile_id of profileIds) {
			this.items.push({ user_id: userId, profile_id })
		}
		return profileIds
	}

	async attachDefault(userId: string): Promise<void> {
		if (!this.defaultProfileId) {
			return
		}
		const already = this.items.some(
			(i) =>
				i.user_id === userId && i.profile_id === this.defaultProfileId,
		)
		if (!already) {
			this.items.push({
				user_id: userId,
				profile_id: this.defaultProfileId,
			})
		}
	}
}
