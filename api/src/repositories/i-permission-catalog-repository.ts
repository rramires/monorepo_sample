import { Permission } from '@/prisma-client'

// Partial edit: `undefined` = leave as-is.
export interface IPermissionUpdateInput {
	action?: string
	label?: string
}

// The curated permission catalog (CRUD on the operations a screen offers). The
// resolution path lives in IPermissionsRepository — this is the management side.
export interface IPermissionCatalogRepository {
	list(screenId?: string): Promise<Permission[]>
	findById(id: string): Promise<Permission | null>
	/** The owning screen's protection flag (mirrors onto the permission), or null. */
	findScreen(screenId: string): Promise<{ is_system: boolean } | null>
	/** UNIQUE(screen_id, action) guard. */
	actionExists(screenId: string, action: string): Promise<boolean>
	create(data: {
		screen_id: string
		action: string
		label: string
		is_system: boolean
	}): Promise<Permission>
	update(id: string, data: IPermissionUpdateInput): Promise<Permission>
	delete(id: string): Promise<void>
	/** How many profiles grant this permission — the no-cascade delete guard. */
	countGrants(id: string): Promise<number>
}
