import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
	ScreenCatalogEntry,
} from '../i-permissions-repository'

// In-memory permissions store for unit tests. Seed `userProfiles`, `grants`
// (one row per granted profile+screen+action key), `memberships`, `defaults`,
// `screenKeys` and `catalog` directly.
export class InMemoryPermissionsRepository implements IPermissionsRepository {
	public userProfiles: { user_id: string; profile_id: string }[] = []
	public grants: {
		profile_id: string
		screen_key: string
		action: string
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
		const byKey = new Map<string, Set<string>>()
		for (const grant of this.grants) {
			if (!mine.has(grant.profile_id)) {
				continue
			}
			const set = byKey.get(grant.screen_key) ?? new Set<string>()
			set.add(grant.action)
			byKey.set(grant.screen_key, set)
		}
		return [...byKey.entries()].map(([screen_key, set]) => ({
			screen_key,
			actions: [...set],
		}))
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
