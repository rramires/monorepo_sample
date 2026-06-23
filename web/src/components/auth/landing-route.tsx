import { LoaderCircle } from 'lucide-react'
import { Navigate } from 'react-router'

import { useAppSidebarPM } from '@/components/app-sidebar/use-app-sidebar-pm'
import { usePermissions } from '@/hooks/use-permissions'
import { Home } from '@/pages/app/home/home'

// The index route ("/"). Sends the user to their resolved landing screen:
// the preferred/default screen (from /me/permissions) → the gym Dashboard if
// they can view it → their first available screen → Account. Avoids a Forbidden
// screen on login.
export function LandingRoute() {
	const { can, isLoading, permissions } = usePermissions()
	const { sections, isLoading: navLoading } = useAppSidebarPM()

	if (isLoading || navLoading) {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
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
		return <Home />
	}
	return <Navigate to={target} replace />
}
