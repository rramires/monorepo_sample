import type { Role } from '@/prisma-client'
import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
} from '@/repositories/i-permissions-repository'
import type { IUsersRepository } from '@/repositories/i-users-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

interface GetUserPermissionsRequest {
	userId: string
}

interface MenuScreen {
	screen_key: string
	screen_name: string
	path: string
	screen_order: number
	module_key: string
	module_name: string
	module_order: number
}

interface GetUserPermissionsResponse {
	role: Role
	screens: EffectiveScreenPermission[]
	menu: MenuScreen[]
	default_screen_key: string | null
}

// Resolves a user's effective permissions. ADMIN bypasses everything (every
// screen, every action true); everyone else is the OR of their profile grants.
export class GetUserPermissionsUseCase {
	constructor(
		private usersRepository: IUsersRepository,
		private permissionsRepository: IPermissionsRepository,
	) {}

	async execute({
		userId,
	}: GetUserPermissionsRequest): Promise<GetUserPermissionsResponse> {
		const user = await this.usersRepository.findById(userId)
		if (!user) {
			throw new ResourceNotFoundError()
		}

		let screens: EffectiveScreenPermission[]
		if (user.role === 'ADMIN') {
			const keys = await this.permissionsRepository.listAllScreenKeys()
			screens = keys.map((screen_key) => ({
				screen_key,
				view: true,
				create: true,
				edit: true,
				delete: true,
			}))
		} else {
			screens =
				await this.permissionsRepository.getEffectivePermissions(userId)
		}

		const viewable = new Set(
			screens.filter((s) => s.view).map((s) => s.screen_key),
		)
		const default_screen_key = await this.resolveDefault(
			userId,
			user.default_screen_key,
			viewable,
		)

		// Build the menu from the catalog: only screens the user may view that
		// have a page (`path`), ordered by (module order, screen order). The
		// frontend groups these into the sidebar without an admin-only fetch.
		const catalog = await this.permissionsRepository.listScreenCatalog()
		const menu: MenuScreen[] = catalog
			.filter((c) => c.path !== null && viewable.has(c.screen_key))
			.sort(
				(a, b) =>
					a.module_order - b.module_order ||
					a.screen_order - b.screen_order,
			)
			.map((c) => ({
				screen_key: c.screen_key,
				screen_name: c.screen_name,
				path: c.path as string,
				screen_order: c.screen_order,
				module_key: c.module_key,
				module_name: c.module_name,
				module_order: c.module_order,
			}))

		return { role: user.role, screens, menu, default_screen_key }
	}

	// User override (if still viewable) → the profile-default grant with the
	// smallest (module order, screen order) the user can view → null.
	private async resolveDefault(
		userId: string,
		override: string | null,
		viewable: Set<string>,
	): Promise<string | null> {
		if (override && viewable.has(override)) {
			return override
		}
		const candidates =
			await this.permissionsRepository.getDefaultScreenCandidates(userId)
		const sorted = candidates
			.filter((c) => viewable.has(c.screen_key))
			.sort(
				(a, b) =>
					a.module_order - b.module_order ||
					a.screen_order - b.screen_order,
			)
		return sorted[0]?.screen_key ?? null
	}
}
