import { type AuthStatus } from './auth-context'
import { useAuth } from './auth-hooks'

// Exposes the auth status the route gate branches on: a spinner while the
// session resolves, a redirect to sign-in for guests, otherwise the child route.
export function useProtectedRoutePM(): { status: AuthStatus } {
	const { status } = useAuth()
	return { status }
}
