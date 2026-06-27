import { FastifyRequest } from 'fastify'

import { ForbiddenError } from '@/use-cases/errors/forbidden-error'
import { ResourceNotFoundError } from '@/use-cases/errors/resource-not-found-error'
import { ScreenUnavailableError } from '@/use-cases/errors/screen-unavailable-error'
import { UnauthorizedError } from '@/use-cases/errors/unauthorized-error'
import { makeGetUserPermissionsUseCase } from '@/use-cases/factories/make-get-user-permissions-use-case'

// An action KEY — a bare CRUD family (`create`) or a composed `family_name`
// (`create_checkin`). Free string now; the catalog is the source of truth.
export type ScreenAction = string

// Authorization guard: allows the request only when the authenticated user
// `can()` perform `action` on `screenKey`. Effective permissions are read from
// the DATABASE each request (never the JWT), so a grant/profile change takes
// effect on the very next request — mirrors verifyUserRole. ADMIN bypasses
// everything. Runs after verifyJwtMiddleware, so `request.user.sub` is set.
function requireScreen(screenKey: string, action: ScreenAction = 'view') {
	return async (request: FastifyRequest) => {
		const getUserPermissions = makeGetUserPermissionsUseCase()

		try {
			const { role, screens, menu } = await getUserPermissions.execute({
				userId: request.user.sub,
			})

			if (role === 'ADMIN') {
				return
			}

			const screen = screens.find((s) => s.screen_key === screenKey)
			if (!screen?.actions.includes(action)) {
				// Authenticated but lacking the grant: 403, not 401.
				throw new ForbiddenError()
			}

			// Granted, but the screen is killed (emergency switch) for non-admins.
			const menuEntry = menu.find((m) => m.screen_key === screenKey)
			if (menuEntry && !menuEntry.is_enabled) {
				throw new ScreenUnavailableError()
			}
		} catch (err) {
			if (err instanceof ResourceNotFoundError) {
				throw new UnauthorizedError()
			}
			throw err
		}
	}
}

export { requireScreen }
