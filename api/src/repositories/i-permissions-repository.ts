// One screen's effective permissions for a user — the OR across all the
// profiles the user holds, keyed by screen `key`. `view` is an explicit granted
// permission now (no longer default-true).
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
	// The screen keys the user is a MEMBER of (drives the sidebar — shown even
	// without a `view` grant or while killed).
	getMembershipScreenKeys(userId: string): Promise<string[]>
	// Every screen key in the catalog (used for the ADMIN all-access view).
	listAllScreenKeys(): Promise<string[]>
	// The landing screens of the user's profiles, with ordering info so the
	// resolver can pick "the first in the sidebar" (smallest module then screen).
	getDefaultScreenCandidates(
		userId: string,
	): Promise<DefaultScreenCandidate[]>
	// The full screen catalog (every navigable screen + its module + kill switch),
	// so the permissions use-case builds the menu without an admin-only fetch.
	listScreenCatalog(): Promise<ScreenCatalogEntry[]>
}

export interface DefaultScreenCandidate {
	screen_key: string
	module_order: number
	screen_order: number
}

// A catalog row: a screen with its page path, module grouping/ordering and kill
// switch. The use-case filters this to the user's membership to form the menu.
export interface ScreenCatalogEntry {
	screen_key: string
	screen_name: string
	path: string | null
	screen_order: number
	module_key: string
	module_name: string
	module_order: number
	is_enabled: boolean
}
