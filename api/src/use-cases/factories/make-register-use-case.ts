import { PrismaUserProfilesRepository } from '@/repositories/prisma/prisma-user-profiles-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'

import { RegisterUseCase } from '../register-use-case'

export function makeRegisterUseCase() {
	const usersRepository = new PrismaUsersRepository()
	const userProfilesRepository = new PrismaUserProfilesRepository()
	const useCase = new RegisterUseCase(usersRepository, userProfilesRepository)
	return useCase
}
