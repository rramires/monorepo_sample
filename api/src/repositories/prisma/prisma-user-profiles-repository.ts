import { prisma } from '@/lib/prisma'

import type { IUserProfilesRepository } from '../i-user-profiles-repository'

export class PrismaUserProfilesRepository implements IUserProfilesRepository {
	async listByUser(userId: string): Promise<string[]> {
		const rows = await prisma.userProfile.findMany({
			where: { user_id: userId },
			select: { profile_id: true },
		})
		return rows.map((r) => r.profile_id)
	}

	async setForUser(userId: string, profileIds: string[]): Promise<string[]> {
		// Keep only ids that resolve to a real profile.
		const existing = await prisma.profile.findMany({
			where: { id: { in: profileIds } },
			select: { id: true },
		})
		const valid = existing.map((p) => p.id)

		await prisma.$transaction([
			prisma.userProfile.deleteMany({ where: { user_id: userId } }),
			prisma.userProfile.createMany({
				data: valid.map((profile_id) => ({
					user_id: userId,
					profile_id,
				})),
			}),
		])
		return valid
	}

	async attachDefault(userId: string): Promise<void> {
		const def = await prisma.profile.findFirst({
			where: { is_default: true },
			select: { id: true },
		})
		if (!def) {
			return
		}
		await prisma.userProfile.upsert({
			where: {
				user_id_profile_id: { user_id: userId, profile_id: def.id },
			},
			update: {},
			create: { user_id: userId, profile_id: def.id },
		})
	}
}
