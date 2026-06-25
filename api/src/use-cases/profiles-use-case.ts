import { CreateProfileBody, UpdateProfileBody } from '@root/contracts'

import { Profile } from '@/prisma-client'
import {
	IProfilesRepository,
	ProfileScreenGrant,
} from '@/repositories/i-profiles-repository'

import { DefaultProfileRequiredError } from './errors/default-profile-required-error'
import { InvalidLandingScreenError } from './errors/invalid-landing-screen-error'
import { ProfileInUseError } from './errors/profile-in-use-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { SystemProfileError } from './errors/system-profile-error'

export class ProfilesUseCase {
	constructor(private profilesRepository: IProfilesRepository) {}

	async list(): Promise<Profile[]> {
		return this.profilesRepository.list()
	}

	async getDetail(
		id: string,
	): Promise<Profile & { screens: ProfileScreenGrant[] }> {
		const detail = await this.profilesRepository.findDetail(id)
		if (!detail) {
			throw new ResourceNotFoundError()
		}
		return detail
	}

	async create(body: CreateProfileBody): Promise<Profile> {
		// `is_system` is never client-settable; the repo always stores false.
		const profile = await this.profilesRepository.create({
			key: body.key,
			name: body.name,
			description: body.description,
			is_default: body.is_default,
		})
		// Single-default invariant: a new default demotes every other profile.
		if (body.is_default) {
			await this.profilesRepository.clearDefaultExcept(profile.id)
		}
		return profile
	}

	async update(id: string, body: UpdateProfileBody): Promise<Profile> {
		const existing = await this.profilesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		// A system profile keeps its grants editable but its key is locked.
		if (
			existing.is_system &&
			body.key !== undefined &&
			body.key !== existing.key
		) {
			throw new SystemProfileError(
				'A system profile key cannot be changed.',
			)
		}

		// Single-default invariant: never leave zero defaults. Turning the
		// current default off is rejected — to move it, enable another profile
		// (which demotes this one). Turning a profile on demotes the rest.
		if (body.is_default === false && existing.is_default) {
			throw new DefaultProfileRequiredError()
		}

		const profile = await this.profilesRepository.update(id, body)
		if (body.is_default === true) {
			await this.profilesRepository.clearDefaultExcept(id)
		}
		return profile
	}

	async remove(id: string): Promise<void> {
		const existing = await this.profilesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		if (existing.is_system) {
			throw new SystemProfileError('A system profile cannot be deleted.')
		}

		// No cascade: a profile still assigned to users can't be deleted.
		const users = await this.profilesRepository.countUsers(id)
		if (users > 0) {
			throw new ProfileInUseError(users)
		}

		await this.profilesRepository.delete(id)
	}

	async setGrants(
		id: string,
		grants: ProfileScreenGrant[],
		defaultScreenId: string | null,
	): Promise<Profile & { screens: ProfileScreenGrant[] }> {
		const existing = await this.profilesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		// The landing screen must be one of the assigned screens.
		if (
			defaultScreenId !== null &&
			!grants.some((g) => g.screen_id === defaultScreenId)
		) {
			throw new InvalidLandingScreenError()
		}

		await this.profilesRepository.setGrants(id, grants, defaultScreenId)

		// Return the fresh detail (guaranteed present — existence checked above).
		const detail = await this.profilesRepository.findDetail(id)
		if (!detail) {
			throw new ResourceNotFoundError()
		}
		return detail
	}
}
