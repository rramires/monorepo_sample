import { LoaderCircle } from 'lucide-react'
import { Outlet } from 'react-router'

import { type ScreenAction } from '@/hooks/use-permissions'

import { Forbidden } from './forbidden'
import { useRequireScreenPM } from './use-require-screen-pm'

// Sits *inside* ProtectedRoute (the user is already authed). Renders the child
// route only when the user `can()` perform the given action on the screen;
// otherwise shows Forbidden in place — the layout (sidebar, header) stays put.
// This is the route-level mirror of the menu/button `can()` checks; the backend
// enforces the same with `requireScreen` later (defense in depth).
export function RequireScreen({
	screen,
	action = 'view',
}: {
	screen: string
	action?: ScreenAction
}) {
	const pm = useRequireScreenPM(screen, action)

	return (
		<>
			{pm.status === 'loading' && (
				<div className='flex flex-1 items-center justify-center p-8'>
					<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
				</div>
			)}

			{pm.status === 'no-access' && (
				<Forbidden
					title='403 — No access'
					message="You don't have access to this screen yet."
				/>
			)}

			{pm.status === 'disabled' && (
				<Forbidden
					title='Temporarily unavailable'
					message='This screen is temporarily unavailable.'
				/>
			)}

			{pm.status === 'allowed' && <Outlet />}
		</>
	)
}
