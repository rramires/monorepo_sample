import { randomUUID } from 'node:crypto'

import { Notice } from '@/prisma-client'

import { INoticesRepository, INoticeUpdateInput } from '../i-notices-repository'

export class InMemoryNoticesRepository implements INoticesRepository {
	public items: Notice[] = []

	async list() {
		return this.items
	}

	async create(data: { title: string; category: string }) {
		// id + created_at são gerados aqui (no real, o Prisma faz via @default).
		const notice = {
			id: randomUUID(),
			title: data.title,
			category: data.category,
			created_at: new Date(),
		}
		this.items.push(notice)
		return notice
	}

	async findById(id: string) {
		return this.items.find((item) => item.id === id) ?? null
	}

	async update(id: string, data: INoticeUpdateInput) {
		// O use-case garante existência; muda só os campos providos.
		const notice = this.items.find((item) => item.id === id)
		if (!notice) {
			throw new Error('Notice not found')
		}
		if (data.title !== undefined) {
			notice.title = data.title
		}
		if (data.category !== undefined) {
			notice.category = data.category
		}
		return notice
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id)
		if (index >= 0) {
			this.items.splice(index, 1)
		}
	}
}
