import { type Role } from './auth-context'
import { useAuth } from './auth-hooks'

// Resolves what RoleRoute should render: a spinner while the session loads,
// Forbidden when the user's role isn't allowed, otherwise the child route.
export type RoleRouteStatus = 'loading' | 'forbidden' | 'allowed'

export function useRoleRoutePM(allow: Role[]): { status: RoleRouteStatus } {
	const { status, user } = useAuth()

	if (status === 'loading') {
		return { status: 'loading' }
	}

	if (!user || !allow.includes(user.role)) {
		return { status: 'forbidden' }
	}

	return { status: 'allowed' }
}
