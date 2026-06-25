import { Screen } from '@/prisma-client'

// Create payload uses the FK directly (`module_id`) rather than a nested
// `module` connect — the use-case passes the validated body straight through.
// is_active/is_enabled default true at the DB, so they aren't set on create.
export interface IScreenCreateInput {
	module_id: string
	key: string
	name: string
	path?: string | null
	description?: string | null
	order?: number
}

// Partial edit: `undefined` = leave as-is; `null` clears the nullable
// path/description. Adds the two lifecycle switches.
export interface IScreenUpdateInput {
	module_id?: string
	key?: string
	name?: string
	path?: string | null
	description?: string | null
	order?: number
	is_active?: boolean
	is_enabled?: boolean
}

export interface IScreensRepository {
	list(moduleId?: string): Promise<Screen[]>
	create(data: IScreenCreateInput): Promise<Screen>
	findById(id: string): Promise<Screen | null>
	update(id: string, data: IScreenUpdateInput): Promise<Screen>
	delete(id: string): Promise<void>
	/** How many profiles list this screen — the no-cascade delete guard. */
	countMembers(id: string): Promise<number>
}
