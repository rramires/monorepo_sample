import { FastifyRequest } from 'fastify'

import { makeGetUserPermissionsUseCase } from '@/use-cases/factories/make-get-user-permissions-use-case'

// Seeing deactivated gyms is a management capability. The /gyms/search and
// /gyms/nearby routes serve both members and managers (only verifyJwt, no
// requireScreen), so the `includeInactive` flag is gated here: honored only when
// the caller can edit gyms (ADMIN bypasses). A member passing it still gets
// active-only.
export async function resolveIncludeInactive(
	request: FastifyRequest,
	requested: boolean,
): Promise<boolean> {
	if (!requested) {
		return false
	}

	const getUserPermissions = makeGetUserPermissionsUseCase()
	const { role, screens } = await getUserPermissions.execute({
		userId: request.user.sub,
	})

	return (
		role === 'ADMIN' ||
		Boolean(screens.find((s) => s.screen_key === 'gym.gyms')?.edit)
	)
}
