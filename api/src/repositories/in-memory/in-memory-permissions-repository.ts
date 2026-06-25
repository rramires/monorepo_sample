import type { PermissionAction } from '@/prisma-client/enums'

import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
	ScreenCatalogEntry,
} from '../i-permissions-repository'

// In-memory permissions store for unit tests. Seed `userProfiles`, `grants`
// (one row per granted profile+screen+action), `memberships`, `defaults`,
// `screenKeys` and `catalog` directly.
export class InMemoryPermissionsRepository implements IPermissionsRepository {
	public userProfiles: { user_id: string; profile_id: string }[] = []
	public grants: {
		profile_id: string
		screen_key: string
		action: PermissionAction
	}[] = []
	public memberships: { profile_id: string; screen_key: string }[] = []
	public defaults: {
		profile_id: string
		screen_key: string
		module_order: number
		screen_order: number
	}[] = []
	public screenKeys: string[] = []
	public catalog: ScreenCatalogEntry[] = []

	private myProfiles(userId: string): Set<string> {
		return new Set(
			this.userProfiles
				.filter((up) => up.user_id === userId)
				.map((up) => up.profile_id),
		)
	}

	async getEffectivePermissions(
		userId: string,
	): Promise<EffectiveScreenPermission[]> {
		const mine = this.myProfiles(userId)
		const byKey = new Map<string, EffectiveScreenPermission>()
		for (const grant of this.grants) {
			if (!mine.has(grant.profile_id)) {
				continue
			}
			const entry = byKey.get(grant.screen_key) ?? {
				screen_key: grant.screen_key,
				view: false,
				create: false,
				edit: false,
				delete: false,
			}
			entry[grant.action] = true
			byKey.set(grant.screen_key, entry)
		}
		return [...byKey.values()]
	}

	async getMembershipScreenKeys(userId: string): Promise<string[]> {
		const mine = this.myProfiles(userId)
		return [
			...new Set(
				this.memberships
					.filter((m) => mine.has(m.profile_id))
					.map((m) => m.screen_key),
			),
		]
	}

	async listAllScreenKeys(): Promise<string[]> {
		return this.screenKeys
	}

	async getDefaultScreenCandidates(userId: string) {
		const mine = this.myProfiles(userId)
		return this.defaults
			.filter((d) => mine.has(d.profile_id))
			.map((d) => ({
				screen_key: d.screen_key,
				module_order: d.module_order,
				screen_order: d.screen_order,
			}))
	}

	async listScreenCatalog() {
		return this.catalog
	}
}
