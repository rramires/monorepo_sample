import { PrismaProfilesRepository } from '@/repositories/prisma/prisma-profiles-repository'

import { ProfilesUseCase } from '../profiles-use-case'

export function makeProfilesUseCase() {
	const profilesRepository = new PrismaProfilesRepository()
	const useCase = new ProfilesUseCase(profilesRepository)
	return useCase
}
