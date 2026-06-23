import { PrismaUserProfilesRepository } from '@/repositories/prisma/prisma-user-profiles-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'

import { UserProfilesUseCase } from '../user-profiles-use-case'

export function makeUserProfilesUseCase() {
	const usersRepository = new PrismaUsersRepository()
	const userProfilesRepository = new PrismaUserProfilesRepository()
	return new UserProfilesUseCase(usersRepository, userProfilesRepository)
}
