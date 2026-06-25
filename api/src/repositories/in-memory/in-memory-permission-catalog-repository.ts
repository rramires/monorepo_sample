import { randomUUID } from 'node:crypto'

import { Permission } from '@/prisma-client'

import {
	IPermissionCatalogRepository,
	IPermissionUpdateInput,
} from '../i-permission-catalog-repository'

// In-memory catalog for unit tests. Seed `items`, `screens` (for is_system +
// existence) and `grants` (for the in-use guard) directly.
export class InMemoryPermissionCatalogRepository implements IPermissionCatalogRepository {
	public items: Permission[] = []
	public screens: { id: string; is_system: boolean }[] = []
	public grants: { profile_id: string; permission_id: string }[] = []

	async list(screenId?: string) {
		if (screenId) {
			return this.items.filter((p) => p.screen_id === screenId)
		}
		return this.items
	}

	async findById(id: string) {
		return this.items.find((p) => p.id === id) || null
	}

	async findScreen(screenId: string) {
		const screen = this.screens.find((s) => s.id === screenId)
		return screen ? { is_system: screen.is_system } : null
	}

	async actionExists(screenId: string, action: string) {
		return this.items.some(
			(p) => p.screen_id === screenId && p.action === action,
		)
	}

	async create(data: {
		screen_id: string
		action: string
		label: string
		is_system: boolean
	}) {
		const permission = { id: randomUUID(), ...data }
		this.items.push(permission)
		return permission
	}

	async update(id: string, data: IPermissionUpdateInput) {
		const permission = this.items.find((p) => p.id === id)
		if (!permission) {
			throw new Error('Permission not found')
		}
		if (data.action !== undefined) {
			permission.action = data.action
		}
		if (data.label !== undefined) {
			permission.label = data.label
		}
		return permission
	}

	async delete(id: string) {
		const index = this.items.findIndex((p) => p.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
	}

	async countGrants(id: string) {
		return this.grants.filter((g) => g.permission_id === id).length
	}
}
