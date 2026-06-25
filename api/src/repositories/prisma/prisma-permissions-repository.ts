import { prisma } from '@/lib/prisma'

import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
} from '../i-permissions-repository'

export class PrismaPermissionsRepository implements IPermissionsRepository {
	async getEffectivePermissions(
		userId: string,
	): Promise<EffectiveScreenPermission[]> {
		// Every granted permission from every profile the user holds, with the
		// permission's action and its screen key.
		const grants = await prisma.profilePermission.findMany({
			where: { profile: { users: { some: { user_id: userId } } } },
			include: {
				permission: {
					select: {
						action: true,
						screen: { select: { key: true } },
					},
				},
			},
		})

		// Union the granted action keys per screen key.
		const byKey = new Map<string, Set<string>>()
		for (const grant of grants) {
			const key = grant.permission.screen.key
			const set = byKey.get(key) ?? new Set<string>()
			set.add(grant.permission.action)
			byKey.set(key, set)
		}
		return [...byKey.entries()].map(([screen_key, set]) => ({
			screen_key,
			actions: [...set],
		}))
	}

	async getMembershipScreenKeys(userId: string): Promise<string[]> {
		const rows = await prisma.profileScreen.findMany({
			where: { profile: { users: { some: { user_id: userId } } } },
			include: { screen: { select: { key: true } } },
		})
		return [...new Set(rows.map((r) => r.screen.key))]
	}

	async listAllScreenKeys(): Promise<string[]> {
		const screens = await prisma.screen.findMany({ select: { key: true } })
		return screens.map((s) => s.key)
	}

	async getDefaultScreenCandidates(userId: string) {
		const profiles = await prisma.profile.findMany({
			where: {
				users: { some: { user_id: userId } },
				default_screen_id: { not: null },
			},
			include: {
				default_screen: {
					select: {
						key: true,
						order: true,
						module: { select: { order: true } },
					},
				},
			},
		})
		return profiles
			.filter((p) => p.default_screen !== null)
			.map((p) => ({
				screen_key: p.default_screen!.key,
				module_order: p.default_screen!.module.order,
				screen_order: p.default_screen!.order,
			}))
	}

	async listScreenCatalog() {
		const screens = await prisma.screen.findMany({
			include: {
				module: { select: { key: true, name: true, order: true } },
			},
		})
		return screens.map((s) => ({
			screen_key: s.key,
			screen_name: s.name,
			path: s.path,
			screen_order: s.order,
			module_key: s.module.key,
			module_name: s.module.name,
			module_order: s.module.order,
			is_enabled: s.is_enabled,
		}))
	}
}
