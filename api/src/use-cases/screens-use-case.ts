import { CreateScreenBody, UpdateScreenBody } from '@root/contracts'

import { Screen } from '@/prisma-client'
import { IScreensRepository } from '@/repositories/i-screens-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

export class ScreensUseCase {
	constructor(private screensRepository: IScreensRepository) {}

	async list(moduleId?: string): Promise<Screen[]> {
		const screens = await this.screensRepository.list(moduleId)
		return screens
	}

	async create(body: CreateScreenBody): Promise<Screen> {
		const screen = await this.screensRepository.create(body)
		return screen
	}

	async update(id: string, body: UpdateScreenBody): Promise<Screen> {
		// Guard existence first so a missing id is a 404, not a Prisma throw.
		const existing = await this.screensRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}
		const screen = await this.screensRepository.update(id, body)
		return screen
	}

	async remove(id: string): Promise<void> {
		const existing = await this.screensRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}
		// Deleting a screen cascades its grants at the DB level — no extra guard.
		await this.screensRepository.delete(id)
	}
}
