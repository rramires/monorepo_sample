import { PrismaModulesRepository } from '@/repositories/prisma/prisma-modules-repository'

import { ModulesUseCase } from '../modules-use-case'

export function makeModulesUseCase() {
	const modulesRepository = new PrismaModulesRepository()
	const useCase = new ModulesUseCase(modulesRepository)
	return useCase
}
