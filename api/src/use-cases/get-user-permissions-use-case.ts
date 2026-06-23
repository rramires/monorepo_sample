import type { Role } from '@/prisma-client'
import type {
	EffectiveScreenPermission,
	IPermissionsRepository,
} from '@/repositories/i-permissions-repository'
import type { IUsersRepository } from '@/repositories/i-users-repository'

import { ResourceNotFoundError } from './errors/resource-not-found-error'

interface GetUserPermissionsRequest {
	userId: string
}

interface GetUserPermissionsResponse {
	role: Role
	screens: EffectiveScreenPermission[]
}

// Resolves a user's effective permissions. ADMIN bypasses everything (every
// screen, every action true); everyone else is the OR of their profile grants.
export class GetUserPermissionsUseCase {
	constructor(
		private usersRepository: IUsersRepository,
		private permissionsRepository: IPermissionsRepository,
	) {}

	async execute({
		userId,
	}: GetUserPermissionsRequest): Promise<GetUserPermissionsResponse> {
		const user = await this.usersRepository.findById(userId)
		if (!user) {
			throw new ResourceNotFoundError()
		}

		if (user.role === 'ADMIN') {
			const keys = await this.permissionsRepository.listAllScreenKeys()
			return {
				role: user.role,
				screens: keys.map((screen_key) => ({
					screen_key,
					view: true,
					create: true,
					edit: true,
					delete: true,
				})),
			}
		}

		const screens =
			await this.permissionsRepository.getEffectivePermissions(userId)
		return { role: user.role, screens }
	}
}
