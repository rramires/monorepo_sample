import { PERMISSION_FAMILIES } from '@root/contracts'

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
	is_enabled: boolean
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
		let membership: Set<string>
		if (user.role === 'ADMIN') {
			const keys = await this.permissionsRepository.listAllScreenKeys()
			// Admin authorizes by ROLE bypass (requireScreen/can short-circuit),
			// so this list is informational — each screen carries the base CRUD
			// families to signal "all base ops".
			screens = keys.map((screen_key) => ({
				screen_key,
				actions: [...PERMISSION_FAMILIES],
			}))
			// Admin sees every screen in the menu.
			membership = new Set(keys)
		} else {
			screens =
				await this.permissionsRepository.getEffectivePermissions(userId)
			membership = new Set(
				await this.permissionsRepository.getMembershipScreenKeys(
					userId,
				),
			)
		}

		const viewable = new Set(
			screens
				.filter((s) => s.actions.includes('view'))
				.map((s) => s.screen_key),
		)
		const default_screen_key = await this.resolveDefault(
			userId,
			user.default_screen_key,
			viewable,
		)

		// Build the menu from the catalog: the user's MEMBERSHIP screens that have
		// a page (`path`) — shown even without a `view` grant (staged rollout) or
		// while killed; the kill switch travels as `is_enabled` so the guard can
		// pick the right Forbidden message. Ordered by (module, screen) order.
		const catalog = await this.permissionsRepository.listScreenCatalog()
		const menu: MenuScreen[] = catalog
			.filter((c) => c.path !== null && membership.has(c.screen_key))
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
				is_enabled: c.is_enabled,
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
