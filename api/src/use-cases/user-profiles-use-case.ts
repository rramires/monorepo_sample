import type { IUserProfilesRepository } from '@/repositories/i-user-profiles-repository'
import type { IUsersRepository } from '@/repositories/i-users-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

export class UserProfilesUseCase {
	constructor(
		private usersRepository: IUsersRepository,
		private userProfilesRepository: IUserProfilesRepository,
	) {}

	async getForUser(userId: string): Promise<{ profileIds: string[] }> {
		await this.ensureUser(userId)
		const profileIds = await this.userProfilesRepository.listByUser(userId)
		return { profileIds }
	}

	async setForUser(
		userId: string,
		profileIds: string[],
	): Promise<{ profileIds: string[] }> {
		await this.ensureUser(userId)
		const saved = await this.userProfilesRepository.setForUser(
			userId,
			profileIds,
		)
		return { profileIds: saved }
	}

	private async ensureUser(userId: string) {
		const user = await this.usersRepository.findById(userId)
		if (!user) {
			throw new ResourceNotFoundError()
		}
	}
}
