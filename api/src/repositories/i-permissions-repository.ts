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
}
