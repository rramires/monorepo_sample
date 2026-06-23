import { prisma } from '@/lib/prisma'

import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
} from '../i-permissions-repository'

export class PrismaPermissionsRepository implements IPermissionsRepository {
	async getEffectivePermissions(
		userId: string,
	): Promise<EffectiveScreenPermission[]> {
		// All grants from every profile the user holds, with the screen key.
		const grants = await prisma.profileScreen.findMany({
			where: { profile: { users: { some: { user_id: userId } } } },
			include: { screen: { select: { key: true } } },
		})

		// OR the actions per screen key.
		const byKey = new Map<string, EffectiveScreenPermission>()
		for (const grant of grants) {
			const key = grant.screen.key
			const prev = byKey.get(key) ?? {
				screen_key: key,
				view: false,
				create: false,
				edit: false,
				delete: false,
			}
			byKey.set(key, {
				screen_key: key,
				view: prev.view || grant.can_view,
				create: prev.create || grant.can_create,
				edit: prev.edit || grant.can_edit,
				delete: prev.delete || grant.can_delete,
			})
		}
		return [...byKey.values()]
	}

	async listAllScreenKeys(): Promise<string[]> {
		const screens = await prisma.screen.findMany({ select: { key: true } })
		return screens.map((s) => s.key)
	}

	async getDefaultScreenCandidates(userId: string) {
		const grants = await prisma.profileScreen.findMany({
			where: {
				is_default: true,
				profile: { users: { some: { user_id: userId } } },
			},
			include: {
				screen: {
					select: {
						key: true,
						order: true,
						module: { select: { order: true } },
					},
				},
			},
		})
		return grants.map((g) => ({
			screen_key: g.screen.key,
			module_order: g.screen.module.order,
			screen_order: g.screen.order,
		}))
	}
}
