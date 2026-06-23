// One screen's effective permissions for a user — the OR across all the
// profiles the user holds, keyed by screen `key`.
export interface EffectiveScreenPermission {
	screen_key: string
	view: boolean
	create: boolean
	edit: boolean
	delete: boolean
}

export interface IPermissionsRepository {
	// Effective (unioned) grants for a user across their profiles.
	getEffectivePermissions(
		userId: string,
	): Promise<EffectiveScreenPermission[]>
	// Every screen key in the catalog (used for the ADMIN all-access view).
	listAllScreenKeys(): Promise<string[]>
	// Profile-default grants for a user, with ordering info so the resolver can
	// pick "the first in the sidebar" (smallest module then screen order).
	getDefaultScreenCandidates(
		userId: string,
	): Promise<DefaultScreenCandidate[]>
	// The full screen catalog (every navigable screen + its module), so the
	// permissions use-case can build the user's menu without an admin-only fetch.
	listScreenCatalog(): Promise<ScreenCatalogEntry[]>
}

export interface DefaultScreenCandidate {
	screen_key: string
	module_order: number
	screen_order: number
}

// A catalog row: a screen with its page path and module grouping/ordering. The
// use-case filters this down to what each user may view to form the menu.
export interface ScreenCatalogEntry {
	screen_key: string
	screen_name: string
	path: string | null
	screen_order: number
	module_key: string
	module_name: string
	module_order: number
}
