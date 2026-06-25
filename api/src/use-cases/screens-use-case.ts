import { CreateScreenBody, UpdateScreenBody } from '@root/contracts'

import { Screen } from '@/prisma-client'
import { IScreensRepository } from '@/repositories/i-screens-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { ScreenInUseError } from './errors/screen-in-use-error'
import { SystemScreenError } from './errors/system-screen-error'

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

		// A system screen's identity is locked — its key, module and path are
		// wiring the app depends on (the requireScreen key, the sidebar group,
		// the route the menu links to). Only name/description/order stay editable.
		if (existing.is_system) {
			const changesKey =
				body.key !== undefined && body.key !== existing.key
			const changesModule =
				body.module_id !== undefined &&
				body.module_id !== existing.module_id
			const changesPath =
				body.path !== undefined && body.path !== existing.path
			if (changesKey || changesModule || changesPath) {
				throw new SystemScreenError(
					'A system screen cannot change its key, module or path.',
				)
			}
		}

		const screen = await this.screensRepository.update(id, body)
		return screen
	}

	async remove(id: string): Promise<void> {
		const existing = await this.screensRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		if (existing.is_system) {
			throw new SystemScreenError('A system screen cannot be deleted.')
		}

		// No cascade: a screen still assigned to profiles can't be deleted.
		const members = await this.screensRepository.countMembers(id)
		if (members > 0) {
			throw new ScreenInUseError(members)
		}

		await this.screensRepository.delete(id)
	}
}
