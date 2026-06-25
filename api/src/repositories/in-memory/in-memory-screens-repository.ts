import { randomUUID } from 'node:crypto'

import { Screen } from '@/prisma-client'

import {
	IScreenCreateInput,
	IScreensRepository,
	IScreenUpdateInput,
} from '../i-screens-repository'

export class InMemoryScreensRepository implements IScreensRepository {
	// in-memory mock database
	public items: Screen[] = []
	// Membership rows — seed in tests for the delete guard.
	public memberships: { profile_id: string; screen_id: string }[] = []

	async list(moduleId?: string) {
		if (moduleId) {
			return this.items.filter((item) => item.module_id === moduleId)
		}
		return this.items
	}

	async create(data: IScreenCreateInput) {
		// new screen — is_active/is_enabled default true; is_system never client-set.
		const screen = {
			id: randomUUID(),
			module_id: data.module_id,
			key: data.key,
			name: data.name,
			path: data.path ?? null,
			description: data.description ?? null,
			order: data.order ?? 0,
			is_system: false,
			is_active: true,
			is_enabled: true,
		}
		this.items.push(screen)

		return screen
	}

	async findById(id: string) {
		const screen = this.items.find((item) => item.id === id)
		return screen || null
	}

	async update(id: string, data: IScreenUpdateInput) {
		// Use-case guards existence; mutate only the provided fields.
		const screen = this.items.find((item) => item.id === id)
		if (!screen) {
			throw new Error('Screen not found')
		}
		if (data.module_id !== undefined) {
			screen.module_id = data.module_id
		}
		if (data.key !== undefined) {
			screen.key = data.key
		}
		if (data.name !== undefined) {
			screen.name = data.name
		}
		if (data.path !== undefined) {
			screen.path = data.path
		}
		if (data.description !== undefined) {
			screen.description = data.description
		}
		if (data.order !== undefined) {
			screen.order = data.order
		}
		if (data.is_active !== undefined) {
			screen.is_active = data.is_active
		}
		if (data.is_enabled !== undefined) {
			screen.is_enabled = data.is_enabled
		}
		return screen
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
	}

	async countMembers(id: string) {
		return this.memberships.filter((m) => m.screen_id === id).length
	}
}
