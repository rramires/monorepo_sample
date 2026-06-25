import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryPermissionsRepository } from '@/repositories/in-memory/in-memory-permissions-repository'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { GetUserPermissionsUseCase } from './get-user-permissions-use-case'

let usersRepository: InMemoryUsersRepository
let permissionsRepository: InMemoryPermissionsRepository
let sut: GetUserPermissionsUseCase

describe('Get User Permissions Use Case', () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository()
		permissionsRepository = new InMemoryPermissionsRepository()
		sut = new GetUserPermissionsUseCase(
			usersRepository,
			permissionsRepository,
		)
	})

	it('grants an ADMIN every screen and every action', async () => {
		const admin = await usersRepository.create({
			username: 'admin',
			email: 'admin@example.com',
			password_hash: 'x',
			role: 'ADMIN',
		})
		permissionsRepository.screenKeys = ['gym.dashboard', 'gym.gyms']

		const { role, screens } = await sut.execute({ userId: admin.id })

		expect(role).toBe('ADMIN')
		expect(screens).toHaveLength(2)
		expect(
			screens.every((s) => s.view && s.create && s.edit && s.delete),
		).toBe(true)
	})

	it('ORs the grants across a USER’s profiles', async () => {
		const user = await usersRepository.create({
			username: 'jane',
			email: 'jane@example.com',
			password_hash: 'x',
			role: 'USER',
		})
		permissionsRepository.userProfiles = [
			{ user_id: user.id, profile_id: 'p1' },
			{ user_id: user.id, profile_id: 'p2' },
		]
		// One granted permission row per (profile, screen, action).
		permissionsRepository.grants = [
			{ profile_id: 'p1', screen_key: 'gym.gyms', action: 'view' },
			{ profile_id: 'p2', screen_key: 'gym.gyms', action: 'view' },
			{ profile_id: 'p2', screen_key: 'gym.gyms', action: 'create' },
		]

		const { role, screens } = await sut.execute({ userId: user.id })

		expect(role).toBe('USER')
		expect(screens).toEqual([
			{
				screen_key: 'gym.gyms',
				view: true,
				create: true,
				edit: false,
				delete: false,
			},
		])
	})

	it('throws when the user does not exist', async () => {
		await expect(() =>
			sut.execute({ userId: 'missing' }),
		).rejects.toBeInstanceOf(ResourceNotFoundError)
	})
})
