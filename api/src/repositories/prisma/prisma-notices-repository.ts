import { prisma } from '@/lib/prisma'

import { INoticesRepository, INoticeUpdateInput } from '../i-notices-repository'

export class PrismaNoticesRepository implements INoticesRepository {
	async list() {
		const notices = await prisma.notice.findMany({
			orderBy: { created_at: 'desc' },
		})
		return notices
	}

	async create(data: { title: string; category: string }) {
		const notice = await prisma.notice.create({ data })
		return notice
	}

	async findById(id: string) {
		const notice = await prisma.notice.findUnique({ where: { id } })
		return notice
	}

	async update(id: string, data: INoticeUpdateInput) {
		// Existência é garantida pelo use-case (findById antes); chaves `undefined`
		// são ignoradas pelo Prisma, então só os campos providos mudam.
		const notice = await prisma.notice.update({ where: { id }, data })
		return notice
	}

	async delete(id: string) {
		await prisma.notice.delete({ where: { id } })
	}
}
