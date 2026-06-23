import { prisma } from '@/lib/prisma'

import {
	GrantRow,
	IProfilesRepository,
	IProfileUpdateInput,
} from '../i-profiles-repository'

export class PrismaProfilesRepository implements IProfilesRepository {
	async list() {
		const profiles = await prisma.profile.findMany()
		return profiles
	}

	async findById(id: string) {
		const profile = await prisma.profile.findUnique({
			where: {
				id,
			},
		})
		return profile
	}

	async findDetail(id: string) {
		const profile = await prisma.profile.findUnique({
			where: {
				id,
			},
			include: {
				screens: {
					select: {
						screen_id: true,
						can_view: true,
						can_create: true,
						can_edit: true,
						can_delete: true,
						is_default: true,
					},
				},
			},
		})
		if (!profile) {
			return null
		}

		const { screens, ...rest } = profile
		return {
			...rest,
			screens,
		}
	}

	async create(data: {
		key: string
		name: string
		description?: string | null
		is_default: boolean
	}) {
		const profile = await prisma.profile.create({
			data,
		})
		return profile
	}

	async update(id: string, data: IProfileUpdateInput) {
		// Existence is guaranteed by the use-case (findById first); `undefined`
		// keys are ignored by Prisma, so only provided fields change.
		const profile = await prisma.profile.update({
			where: {
				id,
			},
			data,
		})
		return profile
	}

	async delete(id: string) {
		await prisma.profile.delete({
			where: {
				id,
			},
		})
	}

	async setScreens(id: string, grants: GrantRow[]) {
		// Replace the whole grant set atomically: wipe then re-insert.
		await prisma.$transaction([
			prisma.profileScreen.deleteMany({ where: { profile_id: id } }),
			prisma.profileScreen.createMany({
				data: grants.map((g) => ({ profile_id: id, ...g })),
			}),
		])
	}
}
