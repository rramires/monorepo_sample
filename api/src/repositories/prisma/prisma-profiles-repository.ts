import { prisma } from '@/lib/prisma'

import {
	IProfilesRepository,
	IProfileUpdateInput,
	ProfileScreenGrant,
} from '../i-profiles-repository'

export class PrismaProfilesRepository implements IProfilesRepository {
	async list() {
		const profiles = await prisma.profile.findMany()
		return profiles
	}

	async findById(id: string) {
		const profile = await prisma.profile.findUnique({ where: { id } })
		return profile
	}

	async findDetail(id: string) {
		const profile = await prisma.profile.findUnique({
			where: { id },
			include: {
				screens: { select: { screen_id: true } },
				permissions: {
					include: {
						permission: { select: { id: true, screen_id: true } },
					},
				},
			},
		})
		if (!profile) {
			return null
		}

		const { screens, permissions, ...rest } = profile
		// Group granted permission ids under each membership screen.
		const grants: ProfileScreenGrant[] = screens.map((m) => ({
			screen_id: m.screen_id,
			permission_ids: permissions
				.filter((pp) => pp.permission.screen_id === m.screen_id)
				.map((pp) => pp.permission.id),
		}))
		return { ...rest, screens: grants }
	}

	async create(data: {
		key: string
		name: string
		description?: string | null
		is_default: boolean
	}) {
		const profile = await prisma.profile.create({ data })
		return profile
	}

	async update(id: string, data: IProfileUpdateInput) {
		// Existence is guaranteed by the use-case (findById first); `undefined`
		// keys are ignored by Prisma, so only provided fields change.
		const profile = await prisma.profile.update({ where: { id }, data })
		return profile
	}

	async delete(id: string) {
		// Membership + grants cascade (FK); user assignments are Restrict, so the
		// use-case must 409 first when the profile is still assigned.
		await prisma.profile.delete({ where: { id } })
	}

	async clearDefaultExcept(keepId: string) {
		// Demote every other default in one statement (single-default invariant).
		await prisma.profile.updateMany({
			where: { id: { not: keepId }, is_default: true },
			data: { is_default: false },
		})
	}

	async setGrants(
		id: string,
		grants: ProfileScreenGrant[],
		defaultScreenId: string | null,
	) {
		// Replace membership, grants and landing atomically: wipe then re-insert.
		await prisma.$transaction([
			prisma.profileScreen.deleteMany({ where: { profile_id: id } }),
			prisma.profilePermission.deleteMany({ where: { profile_id: id } }),
			prisma.profileScreen.createMany({
				data: grants.map((g) => ({
					profile_id: id,
					screen_id: g.screen_id,
				})),
			}),
			prisma.profilePermission.createMany({
				data: grants.flatMap((g) =>
					g.permission_ids.map((permission_id) => ({
						profile_id: id,
						permission_id,
					})),
				),
			}),
			prisma.profile.update({
				where: { id },
				data: { default_screen_id: defaultScreenId },
			}),
		])
	}

	async countUsers(id: string) {
		return prisma.userProfile.count({ where: { profile_id: id } })
	}
}
