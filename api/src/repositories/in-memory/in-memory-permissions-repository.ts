import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
	ScreenCatalogEntry,
} from '../i-permissions-repository'

interface Grant {
	profile_id: string
	screen_key: string
	can_view: boolean
	can_create: boolean
	can_edit: boolean
	can_delete: boolean
	is_default?: boolean
	module_order?: number
	screen_order?: number
}

// In-memory permissions store for unit tests. Seed `userProfiles`, `grants`
// (keyed by screen) and `screenKeys` directly.
export class InMemoryPermissionsRepository implements IPermissionsRepository {
	public userProfiles: { user_id: string; profile_id: string }[] = []
	public grants: Grant[] = []
	public screenKeys: string[] = []
	public catalog: ScreenCatalogEntry[] = []

	async getEffectivePermissions(
		userId: string,
	): Promise<EffectiveScreenPermission[]> {
		const myProfiles = new Set(
			this.userProfiles
				.filter((up) => up.user_id === userId)
				.map((up) => up.profile_id),
		)

		const byKey = new Map<string, EffectiveScreenPermission>()
		for (const grant of this.grants) {
			if (!myProfiles.has(grant.profile_id)) {
				continue
			}
			const prev = byKey.get(grant.screen_key) ?? {
				screen_key: grant.screen_key,
				view: false,
				create: false,
				edit: false,
				delete: false,
			}
			byKey.set(grant.screen_key, {
				screen_key: grant.screen_key,
				view: prev.view || grant.can_view,
				create: prev.create || grant.can_create,
				edit: prev.edit || grant.can_edit,
				delete: prev.delete || grant.can_delete,
			})
		}
		return [...byKey.values()]
	}

	async listAllScreenKeys(): Promise<string[]> {
		return this.screenKeys
	}

	async getDefaultScreenCandidates(userId: string) {
		const myProfiles = new Set(
			this.userProfiles
				.filter((up) => up.user_id === userId)
				.map((up) => up.profile_id),
		)
		return this.grants
			.filter((g) => g.is_default && myProfiles.has(g.profile_id))
			.map((g) => ({
				screen_key: g.screen_key,
				module_order: g.module_order ?? 0,
				screen_order: g.screen_order ?? 0,
			}))
	}

	async listScreenCatalog() {
		return this.catalog
	}
}
