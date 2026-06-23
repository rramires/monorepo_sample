import { randomUUID } from 'node:crypto'

import { Module } from '@/prisma-client'

import { IModulesRepository, IModuleUpdateInput } from '../i-modules-repository'

export class InMemoryModulesRepository implements IModulesRepository {
	// in-memory mock database
	public items: Module[] = []

	async list() {
		return this.items
	}

	async create(data: {
		key: string
		name: string
		description?: string | null
		order?: number
	}) {
		// new module
		const module = {
			id: randomUUID(),
			key: data.key,
			name: data.name,
			description: data.description ?? null,
			order: data.order ?? 0,
		}
		this.items.push(module)

		return module
	}

	async findById(id: string) {
		// find by id
		const module = this.items.find((item) => item.id === id)

		return module || null
	}

	async update(id: string, data: IModuleUpdateInput) {
		// Use-case guards existence; mutate only the provided fields.
		const module = this.items.find((item) => item.id === id)
		if (!module) {
			throw new Error('Module not found')
		}
		if (data.key !== undefined) {
			module.key = data.key
		}
		if (data.name !== undefined) {
			module.name = data.name
		}
		if (data.description !== undefined) {
			module.description = data.description
		}
		if (data.order !== undefined) {
			module.order = data.order
		}
		return module
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
	}

	async hasScreens() {
		return false
	}
}
