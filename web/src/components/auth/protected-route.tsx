import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet } from 'react-router'

import { useProtectedRoutePM } from './use-protected-route-pm'

export function ProtectedRoute() {
	const pm = useProtectedRoutePM()

	return (
		<>
			{pm.status === 'loading' && (
				<div className='flex h-screen items-center justify-center'>
					<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
				</div>
			)}

			{pm.status === 'guest' && <Navigate to='/sign-in' replace />}

			{pm.status === 'authed' && <Outlet />}
		</>
	)
}
