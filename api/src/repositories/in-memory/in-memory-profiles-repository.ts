import { randomUUID } from 'node:crypto'

import { Profile } from '@/prisma-client'

import {
	GrantRow,
	IProfilesRepository,
	IProfileUpdateInput,
} from '../i-profiles-repository'

export class InMemoryProfilesRepository implements IProfilesRepository {
	// in-memory mock database
	public items: Profile[] = []
	public grants: Array<{ profile_id: string } & GrantRow> = []

	async list() {
		return this.items
	}

	async findById(id: string) {
		const profile = this.items.find((item) => item.id === id)
		return profile || null
	}

	async findDetail(id: string) {
		const profile = this.items.find((item) => item.id === id)
		if (!profile) {
			return null
		}

		const screens: GrantRow[] = this.grants
			.filter((g) => g.profile_id === id)
			.map((g) => ({
				screen_id: g.screen_id,
				can_view: g.can_view,
				can_create: g.can_create,
				can_edit: g.can_edit,
				can_delete: g.can_delete,
				is_default: g.is_default,
			}))

		return {
			...profile,
			screens,
		}
	}

	async create(data: {
		key: string
		name: string
		description?: string | null
		is_default: boolean
	}) {
		// new profile
		const profile = {
			id: randomUUID(),
			key: data.key,
			name: data.name,
			description: data.description ?? null,
			is_system: false,
			is_default: data.is_default,
			created_at: new Date(),
		}
		this.items.push(profile)

		return profile
	}

	async update(id: string, data: IProfileUpdateInput) {
		// Use-case guards existence; mutate only the provided fields.
		const profile = this.items.find((item) => item.id === id)
		if (!profile) {
			throw new Error('Profile not found')
		}
		if (data.key !== undefined) {
			profile.key = data.key
		}
		if (data.name !== undefined) {
			profile.name = data.name
		}
		if (data.description !== undefined) {
			profile.description = data.description
		}
		if (data.is_default !== undefined) {
			profile.is_default = data.is_default
		}
		return profile
	}

	async clearDefaultExcept(keepId: string) {
		for (const profile of this.items) {
			if (profile.id !== keepId) {
				profile.is_default = false
			}
		}
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
		this.grants = this.grants.filter((g) => g.profile_id !== id)
	}

	async setScreens(id: string, grants: GrantRow[]) {
		// Replace the whole grant set for this profile.
		this.grants = this.grants.filter((g) => g.profile_id !== id)
		for (const g of grants) {
			this.grants.push({ profile_id: id, ...g })
		}
	}
}
