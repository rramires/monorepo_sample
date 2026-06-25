import { randomUUID } from 'node:crypto'

import { Profile } from '@/prisma-client'

import {
	IProfilesRepository,
	IProfileUpdateInput,
	ProfileScreenGrant,
} from '../i-profiles-repository'

export class InMemoryProfilesRepository implements IProfilesRepository {
	// in-memory mock database
	public items: Profile[] = []
	// Membership (which screens a profile lists) + grants (which permissions it
	// holds, denormalized with screen_id so findDetail can group cheaply).
	public memberships: { profile_id: string; screen_id: string }[] = []
	public grants: {
		profile_id: string
		screen_id: string
		permission_id: string
	}[] = []
	// User assignments — seed in tests for the delete guard.
	public userAssignments: { profile_id: string; user_id: string }[] = []

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

		const screenIds = [
			...new Set(
				this.memberships
					.filter((m) => m.profile_id === id)
					.map((m) => m.screen_id),
			),
		]
		const screens: ProfileScreenGrant[] = screenIds.map((screen_id) => ({
			screen_id,
			permission_ids: this.grants
				.filter((g) => g.profile_id === id && g.screen_id === screen_id)
				.map((g) => g.permission_id),
		}))

		return { ...profile, screens }
	}

	async create(data: {
		key: string
		name: string
		description?: string | null
		is_default: boolean
	}) {
		const profile = {
			id: randomUUID(),
			key: data.key,
			name: data.name,
			description: data.description ?? null,
			is_system: false,
			is_default: data.is_default,
			is_active: true,
			default_screen_id: null,
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
		if (data.is_active !== undefined) {
			profile.is_active = data.is_active
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
		this.memberships = this.memberships.filter((m) => m.profile_id !== id)
		this.grants = this.grants.filter((g) => g.profile_id !== id)
	}

	async setGrants(
		id: string,
		grants: ProfileScreenGrant[],
		defaultScreenId: string | null,
	) {
		// Replace the whole grant set for this profile.
		this.memberships = this.memberships.filter((m) => m.profile_id !== id)
		this.grants = this.grants.filter((g) => g.profile_id !== id)
		for (const g of grants) {
			this.memberships.push({ profile_id: id, screen_id: g.screen_id })
			for (const permission_id of g.permission_ids) {
				this.grants.push({
					profile_id: id,
					screen_id: g.screen_id,
					permission_id,
				})
			}
		}
		const profile = this.items.find((item) => item.id === id)
		if (profile) {
			profile.default_screen_id = defaultScreenId
		}
	}

	async countUsers(id: string) {
		return this.userAssignments.filter((a) => a.profile_id === id).length
	}
}
