import { CreateNoticeBody, UpdateNoticeBody } from '@root/contracts'

import { Notice } from '@/prisma-client'
import { INoticesRepository } from '@/repositories/i-notices-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

export class NoticesUseCase {
	constructor(private noticesRepository: INoticesRepository) {}

	async list(): Promise<Notice[]> {
		return this.noticesRepository.list()
	}

	async create(body: CreateNoticeBody): Promise<Notice> {
		return this.noticesRepository.create(body)
	}

	async update(id: string, body: UpdateNoticeBody): Promise<Notice> {
		const existing = await this.noticesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}
		return this.noticesRepository.update(id, body)
	}

	async remove(id: string): Promise<void> {
		const existing = await this.noticesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}
		await this.noticesRepository.delete(id)
	}
}
