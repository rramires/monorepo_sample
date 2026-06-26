import { prisma } from '@/lib/prisma'

import {
	IPermissionCatalogRepository,
	IPermissionUpdateInput,
} from '../i-permission-catalog-repository'

export class PrismaPermissionCatalogRepository implements IPermissionCatalogRepository {
	async list(screenId?: string) {
		return prisma.permission.findMany({
			where: screenId ? { screen_id: screenId } : undefined,
		})
	}

	async findById(id: string) {
		return prisma.permission.findUnique({ where: { id } })
	}

	async findScreen(screenId: string) {
		return prisma.screen.findUnique({
			where: { id: screenId },
			select: { is_system: true },
		})
	}

	async actionExists(screenId: string, action: string) {
		const found = await prisma.permission.findUnique({
			where: { screen_id_action: { screen_id: screenId, action } },
			select: { id: true },
		})
		return found !== null
	}

	async create(data: {
		screen_id: string
		action: string
		label: string
		is_system: boolean
	}) {
		return prisma.permission.create({ data })
	}

	async update(id: string, data: IPermissionUpdateInput) {
		return prisma.permission.update({ where: { id }, data })
	}

	async delete(id: string) {
		await prisma.permission.delete({ where: { id } })
	}

	async countGrants(id: string) {
		return prisma.profilePermission.count({ where: { permission_id: id } })
	}
}
