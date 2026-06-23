import { PrismaScreensRepository } from '@/repositories/prisma/prisma-screens-repository'

import { ScreensUseCase } from '../screens-use-case'

export function makeScreensUseCase() {
	const screensRepository = new PrismaScreensRepository()
	const useCase = new ScreensUseCase(screensRepository)
	return useCase
}
