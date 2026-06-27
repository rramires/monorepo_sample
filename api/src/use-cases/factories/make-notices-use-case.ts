import { PrismaNoticesRepository } from '@/repositories/prisma/prisma-notices-repository'

import { NoticesUseCase } from '../notices-use-case'

export function makeNoticesUseCase() {
	const noticesRepository = new PrismaNoticesRepository()
	const useCase = new NoticesUseCase(noticesRepository)
	return useCase
}
