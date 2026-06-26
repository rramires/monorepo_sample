import { LoaderCircle } from 'lucide-react'
import { Navigate } from 'react-router'

import { Home } from '@/pages/app/home/home'

import { useLandingRoutePM } from './use-landing-route-pm'

// The index route ("/"). Sends the user to their resolved landing screen — see
// useLandingRoutePM for the resolution order.
export function LandingRoute() {
	const pm = useLandingRoutePM()

	return (
		<>
			{pm.status === 'loading' && (
				<div className='flex flex-1 items-center justify-center p-8'>
					<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
				</div>
			)}

			{pm.status === 'home' && <Home />}

			{pm.status === 'navigate' && <Navigate to={pm.to} replace />}
		</>
	)
}
