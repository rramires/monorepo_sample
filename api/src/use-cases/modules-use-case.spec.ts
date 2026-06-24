import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryModulesRepository } from '@/repositories/in-memory/in-memory-modules-repository'

import { SystemModuleError } from './errors/system-module-error'
import { ModulesUseCase } from './modules-use-case'

let modulesRepository: InMemoryModulesRepository
let sut: ModulesUseCase

// Seed a system module directly (create() always stores is_system:false).
function seedSystemModule() {
	modulesRepository.items.push({
		id: 'sys-module',
		key: 'access-control',
		name: 'Access Control',
		description: null,
		order: 0,
		is_system: true,
	})
}

describe('Modules Use Case — system protection', () => {
	beforeEach(() => {
		modulesRepository = new InMemoryModulesRepository()
		sut = new ModulesUseCase(modulesRepository)
	})

	it('forces is_system to false on create (never client-settable)', async () => {
		const module = await sut.create({
			key: 'gym',
			name: 'Gym',
			description: null,
			order: 1,
		})

		expect(module.is_system).toBe(false)
	})

	it('blocks deleting a system module', async () => {
		seedSystemModule()

		await expect(sut.remove('sys-module')).rejects.toBeInstanceOf(
			SystemModuleError,
		)
		expect(modulesRepository.items).toHaveLength(1)
	})

	it('blocks renaming the key of a system module', async () => {
		seedSystemModule()

		await expect(
			sut.update('sys-module', { key: 'renamed' }),
		).rejects.toBeInstanceOf(SystemModuleError)
	})

	it('still allows non-key edits on a system module', async () => {
		seedSystemModule()

		const module = await sut.update('sys-module', { name: 'Renamed Label' })

		expect(module.name).toEqual('Renamed Label')
		expect(module.key).toEqual('access-control')
	})

	it('still allows deleting and renaming a non-system module', async () => {
		const created = await sut.create({ key: 'gym', name: 'Gym', order: 1 })

		const renamed = await sut.update(created.id, { key: 'gym-2' })
		expect(renamed.key).toEqual('gym-2')

		await sut.remove(created.id)
		expect(modulesRepository.items).toHaveLength(0)
	})
})
