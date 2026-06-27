import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryNoticesRepository } from '@/repositories/in-memory/in-memory-notices-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { NoticesUseCase } from './notices-use-case'

let noticesRepository: InMemoryNoticesRepository
let sut: NoticesUseCase

describe('Notices Use Case', () => {
	beforeEach(() => {
		noticesRepository = new InMemoryNoticesRepository()
		sut = new NoticesUseCase(noticesRepository)
	})

	it('creates a notice (id + created_at generated)', async () => {
		const notice = await sut.create({
			title: 'Pool closed for maintenance',
			category: 'warning',
		})

		expect(notice.id).toEqual(expect.any(String))
		expect(notice.created_at).toBeInstanceOf(Date)
		expect(notice.title).toEqual('Pool closed for maintenance')
		expect(notice.category).toEqual('warning')
		expect(noticesRepository.items).toHaveLength(1)
	})

	it('lists notices', async () => {
		await sut.create({ title: 'A', category: 'info' })
		await sut.create({ title: 'B', category: 'urgent' })

		const notices = await sut.list()

		expect(notices).toHaveLength(2)
	})

	it('updates a notice (only provided fields change)', async () => {
		const created = await sut.create({ title: 'Old', category: 'info' })

		const updated = await sut.update(created.id, { title: 'New' })

		expect(updated.title).toEqual('New')
		expect(updated.category).toEqual('info')
	})

	it('throws ResourceNotFoundError updating a missing notice', async () => {
		await expect(
			sut.update('does-not-exist', { title: 'X' }),
		).rejects.toBeInstanceOf(ResourceNotFoundError)
	})

	it('removes a notice', async () => {
		const created = await sut.create({ title: 'Bye', category: 'info' })

		await sut.remove(created.id)

		expect(noticesRepository.items).toHaveLength(0)
	})

	it('throws ResourceNotFoundError removing a missing notice', async () => {
		await expect(sut.remove('does-not-exist')).rejects.toBeInstanceOf(
			ResourceNotFoundError,
		)
	})
})
