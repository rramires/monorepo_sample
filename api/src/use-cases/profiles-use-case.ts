import { CreateProfileBody, UpdateProfileBody } from '@root/contracts'

import { Profile } from '@/prisma-client'
import {
	GrantRow,
	IProfilesRepository,
} from '@/repositories/i-profiles-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { SystemProfileError } from './errors/system-profile-error'

export class ProfilesUseCase {
	constructor(private profilesRepository: IProfilesRepository) {}

	async list(): Promise<Profile[]> {
		return this.profilesRepository.list()
	}

	async getDetail(id: string): Promise<Profile & { screens: GrantRow[] }> {
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
			throw new SystemProfileError()
		}

		const profile = await this.profilesRepository.update(id, body)
		return profile
	}

	async remove(id: string): Promise<void> {
		const existing = await this.profilesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		if (existing.is_system) {
			throw new SystemProfileError()
		}

		await this.profilesRepository.delete(id)
	}

	async setScreens(
		id: string,
		grants: GrantRow[],
	): Promise<Profile & { screens: GrantRow[] }> {
		const existing = await this.profilesRepository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		await this.profilesRepository.setScreens(id, grants)

		// Return the fresh detail (guaranteed present — existence checked above).
		const detail = await this.profilesRepository.findDetail(id)
		if (!detail) {
			throw new ResourceNotFoundError()
		}
		return detail
	}
}
