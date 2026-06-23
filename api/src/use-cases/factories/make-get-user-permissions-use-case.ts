import { PrismaPermissionsRepository } from '@/repositories/prisma/prisma-permissions-repository'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'

import { GetUserPermissionsUseCase } from '../get-user-permissions-use-case'

export function makeGetUserPermissionsUseCase() {
	const usersRepository = new PrismaUsersRepository()
	const permissionsRepository = new PrismaPermissionsRepository()
	return new GetUserPermissionsUseCase(usersRepository, permissionsRepository)
}
