import { Screen } from '@/prisma-client'

// Create payload uses the FK directly (`module_id`) rather than a nested
// `module` connect — the use-case passes the validated body straight through.
export interface IScreenCreateInput {
	module_id: string
	key: string
	name: string
	path?: string | null
	description?: string | null
	order?: number
}

// Partial edit: `undefined` = leave as-is; `null` clears the nullable
// path/description.
export interface IScreenUpdateInput {
	module_id?: string
	key?: string
	name?: string
	path?: string | null
	description?: string | null
	order?: number
}

export interface IScreensRepository {
	list(moduleId?: string): Promise<Screen[]>
	create(data: IScreenCreateInput): Promise<Screen>
	findById(id: string): Promise<Screen | null>
	update(id: string, data: IScreenUpdateInput): Promise<Screen>
	delete(id: string): Promise<void>
}
