import { CreatePermissionBody, UpdatePermissionBody } from '@root/contracts'

import { Permission } from '@/prisma-client'
import { IPermissionCatalogRepository } from '@/repositories/i-permission-catalog-repository'

import { DuplicatePermissionActionError } from './errors/duplicate-permission-action-error'
import { PermissionInUseError } from './errors/permission-in-use-error'
import { ResourceNotFoundError } from './errors/resource-not-found-error'
import { SystemPermissionError } from './errors/system-permission-error'

// CRUD over a screen's curated permission catalog. `is_system` mirrors the owning
// screen; UNIQUE(screen_id, action) and the no-cascade in-use guard are enforced
// here so the HTTP layer only maps errors to status codes.
export class PermissionsUseCase {
	constructor(private repository: IPermissionCatalogRepository) {}

	async list(screenId?: string): Promise<Permission[]> {
		return this.repository.list(screenId)
	}

	async create(
		screenId: string,
		body: CreatePermissionBody,
	): Promise<Permission> {
		const screen = await this.repository.findScreen(screenId)
		if (!screen) {
			throw new ResourceNotFoundError()
		}
		if (await this.repository.actionExists(screenId, body.action)) {
			throw new DuplicatePermissionActionError(body.action)
		}
		// is_system mirrors the screen — a permission on a system screen is itself
		// protected.
		return this.repository.create({
			screen_id: screenId,
			action: body.action,
			label: body.label,
			is_system: screen.is_system,
		})
	}

	async update(id: string, body: UpdatePermissionBody): Promise<Permission> {
		const existing = await this.repository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		if (body.action !== undefined && body.action !== existing.action) {
			// A system permission's action is the code contract — locked.
			if (existing.is_system) {
				throw new SystemPermissionError(
					"A system permission's action cannot be changed.",
				)
			}
			// UNIQUE(screen_id, action) still holds after a re-target.
			if (
				await this.repository.actionExists(
					existing.screen_id,
					body.action,
				)
			) {
				throw new DuplicatePermissionActionError(body.action)
			}
		}

		return this.repository.update(id, {
			action: body.action,
			label: body.label,
		})
	}

	async remove(id: string): Promise<void> {
		const existing = await this.repository.findById(id)
		if (!existing) {
			throw new ResourceNotFoundError()
		}

		if (existing.is_system) {
			throw new SystemPermissionError(
				'A system permission cannot be deleted.',
			)
		}

		// No cascade: a granted permission can't be deleted.
		const grants = await this.repository.countGrants(id)
		if (grants > 0) {
			throw new PermissionInUseError(grants)
		}

		await this.repository.delete(id)
	}
}
