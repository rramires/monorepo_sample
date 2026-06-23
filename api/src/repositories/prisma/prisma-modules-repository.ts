import { prisma } from '@/lib/prisma'

import { IModulesRepository, IModuleUpdateInput } from '../i-modules-repository'

export class PrismaModulesRepository implements IModulesRepository {
	async list() {
		const modules = await prisma.module.findMany({
			orderBy: {
				order: 'asc',
			},
		})
		return modules
	}

	async create(data: {
		key: string
		name: string
		description?: string | null
		order?: number
	}) {
		const module = await prisma.module.create({
			data,
		})
		return module
	}

	async findById(id: string) {
		const module = await prisma.module.findUnique({
			where: {
				id,
			},
		})
		return module
	}

	async update(id: string, data: IModuleUpdateInput) {
		// Existence is guaranteed by the use-case (findById first); `undefined`
		// keys are ignored by Prisma, so only provided fields change.
		const module = await prisma.module.update({
			where: {
				id,
			},
			data,
		})
		return module
	}

	async delete(id: string) {
		await prisma.module.delete({
			where: {
				id,
			},
		})
	}

	async hasScreens(id: string) {
		return (await prisma.screen.count({ where: { module_id: id } })) > 0
	}
}
