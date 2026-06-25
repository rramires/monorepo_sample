import { PrismaPermissionCatalogRepository } from '@/repositories/prisma/prisma-permission-catalog-repository'

import { PermissionsUseCase } from '../permissions-use-case'

export function makePermissionsUseCase() {
	const repository = new PrismaPermissionCatalogRepository()
	const useCase = new PermissionsUseCase(repository)
	return useCase
}
