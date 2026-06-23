import { Module } from '@/prisma-client'

// Partial edit: `undefined` = leave as-is; `null` clears the nullable
// description.
export interface IModuleUpdateInput {
	key?: string
	name?: string
	description?: string | null
	order?: number
}

export interface IModulesRepository {
	list(): Promise<Module[]>
	create(data: {
		key: string
		name: string
		description?: string | null
		order?: number
	}): Promise<Module>
	findById(id: string): Promise<Module | null>
	update(id: string, data: IModuleUpdateInput): Promise<Module>
	delete(id: string): Promise<void>
	hasScreens(id: string): Promise<boolean>
}
