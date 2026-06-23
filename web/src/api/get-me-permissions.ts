import { mePermissionsSchema, type Role } from '@root/contracts'

import { api } from '@/lib/api'

// The app-side permission model (camelCase). Wire shapes (snake_case) never leak
// past src/api.
export interface ScreenPermission {
	screenKey: string
	view: boolean
	create: boolean
	edit: boolean
	delete: boolean
}

// A navigable screen the user may view — the catalog bits the sidebar groups
// into the menu (so it never calls the admin-gated /modules + /screens).
export interface MenuScreen {
	screenKey: string
	screenName: string
	path: string
	screenOrder: number
	moduleKey: string
	moduleName: string
	moduleOrder: number
}

export interface MyPermissions {
	role: Role
	screens: ScreenPermission[]
	menu: MenuScreen[]
	defaultScreenKey: string | null
}

export async function getMePermissions(): Promise<MyPermissions> {
	const response = await api.get('/me/permissions')

	// Parse through the shared DTO so a backend/mock drift fails loudly here.
	const parsed = mePermissionsSchema.parse(response.data)

	return {
		role: parsed.role,
		screens: parsed.screens.map((s) => ({
			screenKey: s.screen_key,
			view: s.view,
			create: s.create,
			edit: s.edit,
			delete: s.delete,
		})),
		menu: parsed.menu.map((m) => ({
			screenKey: m.screen_key,
			screenName: m.screen_name,
			path: m.path,
			screenOrder: m.screen_order,
			moduleKey: m.module_key,
			moduleName: m.module_name,
			moduleOrder: m.module_order,
		})),
		defaultScreenKey: parsed.default_screen_key,
	}
}
