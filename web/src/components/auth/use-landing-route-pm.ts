import { useAppSidebarPM } from '@/components/app-sidebar/use-app-sidebar-pm'
import { usePermissions } from '@/hooks/use-permissions'

// Resolves the index route ("/"). Picks the user's landing screen: the
// preferred/default screen (from /me/permissions) → the gym Dashboard if they
// can view it → their first available screen → the dashboard at "/". Avoids a
// Forbidden screen on login.
export type LandingTarget =
	| { status: 'loading' }
	| { status: 'home' }
	| { status: 'navigate'; to: string }

export function useLandingRoutePM(): LandingTarget {
	const { can, isLoading, permissions } = usePermissions()
	const { sections, isLoading: navLoading } = useAppSidebarPM()

	if (isLoading || navLoading) {
		return { status: 'loading' }
	}

	const navItems = sections.flatMap((s) => s.items)

	let target: string | undefined
	const preferred = permissions?.defaultScreenKey
	if (preferred) {
		target = navItems.find((i) => i.key === preferred)?.to
	}
	if (!target) {
		target = can('gym.dashboard', 'view') ? '/' : navItems[0]?.to
	}

	// '/' is this very route — render the dashboard rather than redirect to self.
	if (!target || target === '/') {
		return { status: 'home' }
	}
	return { status: 'navigate', to: target }
}
