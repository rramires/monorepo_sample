import { beforeEach, describe, expect, it } from 'vitest'

import { InMemoryProfilesRepository } from '@/repositories/in-memory/in-memory-profiles-repository'

import { DefaultProfileRequiredError } from './errors/default-profile-required-error'
import { ProfilesUseCase } from './profiles-use-case'

let profilesRepository: InMemoryProfilesRepository
let sut: ProfilesUseCase

function makeBody(
	over: Partial<{ key: string; name: string; is_default: boolean }>,
) {
	return {
		key: over.key ?? 'p',
		name: over.name ?? 'P',
		description: null,
		is_default: over.is_default ?? false,
	}
}

describe('Profiles Use Case — single-default invariant', () => {
	beforeEach(() => {
		profilesRepository = new InMemoryProfilesRepository()
		sut = new ProfilesUseCase(profilesRepository)
	})

	it('demotes the previous default when a new profile is created as default', async () => {
		const a = await sut.create(makeBody({ key: 'a', is_default: true }))
		const b = await sut.create(makeBody({ key: 'b', is_default: true }))

		const refreshed = await profilesRepository.findById(a.id)
		expect(refreshed?.is_default).toBe(false)
		expect(b.is_default).toBe(true)
	})

	it('demotes the others when an existing profile is set as default', async () => {
		const a = await sut.create(makeBody({ key: 'a', is_default: true }))
		const b = await sut.create(makeBody({ key: 'b', is_default: false }))

		await sut.update(b.id, { is_default: true })

		expect((await profilesRepository.findById(a.id))?.is_default).toBe(
			false,
		)
		expect((await profilesRepository.findById(b.id))?.is_default).toBe(true)
	})

	it('rejects turning the current default off (would leave zero defaults)', async () => {
		const a = await sut.create(makeBody({ key: 'a', is_default: true }))

		await expect(
			sut.update(a.id, { is_default: false }),
		).rejects.toBeInstanceOf(DefaultProfileRequiredError)

		// Unchanged.
		expect((await profilesRepository.findById(a.id))?.is_default).toBe(true)
	})

	it('lets a non-default profile save with is_default:false (no-op)', async () => {
		await sut.create(makeBody({ key: 'a', is_default: true }))
		const b = await sut.create(makeBody({ key: 'b', is_default: false }))

		await expect(
			sut.update(b.id, { name: 'B2', is_default: false }),
		).resolves.toMatchObject({ name: 'B2', is_default: false })
	})

	it('lets the current default save other fields while staying default', async () => {
		const a = await sut.create(makeBody({ key: 'a', is_default: true }))

		await expect(
			sut.update(a.id, { name: 'A2', is_default: true }),
		).resolves.toMatchObject({ name: 'A2', is_default: true })
	})
})
