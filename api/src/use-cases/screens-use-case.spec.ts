import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryScreensRepository } from '@/repositories/in-memory/in-memory-screens-repository'

import { SystemScreenError } from './errors/system-screen-error'
import { ScreensUseCase } from './screens-use-case'

let screensRepository: InMemoryScreensRepository
let sut: ScreensUseCase

// Seed a system screen directly (create() always stores is_system:false).
function seedSystemScreen() {
	screensRepository.items.push({
		id: 'sys-screen',
		module_id: 'mod-1',
		key: 'access-control.profiles',
		name: 'Profiles',
		path: '/admin/profiles',
		description: null,
		order: 0,
		is_system: true,
		is_active: true,
		is_enabled: true,
	})
}

describe('Screens Use Case — system protection', () => {
	beforeEach(() => {
		screensRepository = new InMemoryScreensRepository()
		sut = new ScreensUseCase(screensRepository)
	})

	it('forces is_system to false on create (never client-settable)', async () => {
		const screen = await sut.create({
			module_id: 'mod-1',
			key: 'gym.gyms',
			name: 'Gyms',
			order: 1,
		})

		expect(screen.is_system).toBe(false)
	})

	it('blocks deleting a system screen', async () => {
		seedSystemScreen()

		await expect(sut.remove('sys-screen')).rejects.toBeInstanceOf(
			SystemScreenError,
		)
		expect(screensRepository.items).toHaveLength(1)
	})

	it('blocks changing the identity of a system screen (key, module, path)', async () => {
		seedSystemScreen()

		await expect(
			sut.update('sys-screen', { key: 'renamed' }),
		).rejects.toBeInstanceOf(SystemScreenError)
		await expect(
			sut.update('sys-screen', { module_id: 'mod-2' }),
		).rejects.toBeInstanceOf(SystemScreenError)
		await expect(
			sut.update('sys-screen', { path: '/somewhere-else' }),
		).rejects.toBeInstanceOf(SystemScreenError)
	})

	it('still allows name/description/order edits on a system screen', async () => {
		seedSystemScreen()

		const screen = await sut.update('sys-screen', {
			name: 'Renamed Label',
			order: 9,
		})

		expect(screen.name).toEqual('Renamed Label')
		expect(screen.order).toEqual(9)
		expect(screen.key).toEqual('access-control.profiles')
		expect(screen.path).toEqual('/admin/profiles')
	})

	it('still allows deleting and renaming a non-system screen', async () => {
		const created = await sut.create({
			module_id: 'mod-1',
			key: 'gym.gyms',
			name: 'Gyms',
			order: 1,
		})

		const renamed = await sut.update(created.id, { key: 'gym.gyms-2' })
		expect(renamed.key).toEqual('gym.gyms-2')

		await sut.remove(created.id)
		expect(screensRepository.items).toHaveLength(0)
	})
})
