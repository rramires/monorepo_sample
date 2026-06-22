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

export interface MyPermissions {
	role: Role
	screens: ScreenPermission[]
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
	}
}
