import { CreateModuleBody, UpdateModuleBody } from '@root/contracts'

import { Module } from '@/prisma-client'
import { IModulesRepository } from '@/repositories/i-modules-repository'

import { ModuleHasScreensError } from './errors/module-has-screens-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { SystemModuleError } from './errors/system-module-error'

export class ModulesUseCase {
	constructor(private modulesRepository: IModulesRepository) {}

	async list(): Promise<Module[]> {
		return this.modulesRepository.list()
	}

	async create(body: CreateModuleBody): Promise<Module> {
		const module = await this.modulesRepository.create(body)
		return module
	}

	async update(id: string, body: UpdateModuleBody): Promise<Module> {
		const existing = await this.modulesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		// A system module keeps its name/order editable but its key is locked.
		if (
			existing.is_system &&
			body.key !== undefined &&
			body.key !== existing.key
		) {
			throw new SystemModuleError(
				'A system module key cannot be changed.',
			)
		}

		const module = await this.modulesRepository.update(id, body)
		return module
	}

	async remove(id: string): Promise<void> {
		const existing = await this.modulesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		if (existing.is_system) {
			throw new SystemModuleError('A system module cannot be deleted.')
		}

		// No cascade: a module that still owns screens can't be deleted.
		if (await this.modulesRepository.hasScreens(id)) {
			throw new ModuleHasScreensError()
		}

		await this.modulesRepository.delete(id)
	}
}
