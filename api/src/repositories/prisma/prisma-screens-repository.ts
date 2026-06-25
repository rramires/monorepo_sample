import { prisma } from '@/lib/prisma'

import {
	IScreenCreateInput,
	IScreensRepository,
	IScreenUpdateInput,
} from '../i-screens-repository'

export class PrismaScreensRepository implements IScreensRepository {
	async list(moduleId?: string) {
		const screens = await prisma.screen.findMany({
			where: moduleId ? { module_id: moduleId } : undefined,
		})
		return screens
	}

	async create(data: IScreenCreateInput) {
		const screen = await prisma.screen.create({
			data,
		})
		return screen
	}

	async findById(id: string) {
		const screen = await prisma.screen.findUnique({
			where: {
				id,
			},
		})
		return screen
	}

	async update(id: string, data: IScreenUpdateInput) {
		// Existence is guaranteed by the use-case (findById first); `undefined`
		// keys are ignored by Prisma, so only provided fields change.
		const screen = await prisma.screen.update({
			where: {
				id,
			},
			data,
		})
		return screen
	}

	async delete(id: string) {
		// Permissions cascade with the screen (FK); membership is Restrict, so the
		// use-case must 409 first when the screen is still assigned.
		await prisma.screen.delete({
			where: {
				id,
			},
		})
	}

	async countMembers(id: string) {
		return prisma.profileScreen.count({ where: { screen_id: id } })
	}
}
