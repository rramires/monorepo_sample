import { LoaderCircle } from 'lucide-react'
import { Navigate } from 'react-router'

import { useAppSidebarPM } from '@/components/app-sidebar/use-app-sidebar-pm'
import { usePermissions } from '@/hooks/use-permissions'
import { Home } from '@/pages/app/home/home'

// The index route ("/"). Shows the gym Dashboard to anyone who can view it;
// otherwise sends the user to their first available screen (e.g. support lands
// on Users), falling back to Account. Avoids a Forbidden screen on login.
export function LandingRoute() {
	const { can, isLoading } = usePermissions()
	const { sections, isLoading: navLoading } = useAppSidebarPM()

	if (isLoading || navLoading) {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (can('gym.dashboard', 'view')) {
		return <Home />
	}

	const firstPath = sections[0]?.items[0]?.to
	return <Navigate to={firstPath ?? '/account'} replace />
}
