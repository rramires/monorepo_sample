import { LoaderCircle } from 'lucide-react'
import { Outlet } from 'react-router'

import { type ScreenAction, usePermissions } from '@/hooks/use-permissions'

import { Forbidden } from './forbidden'

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
	const { can, isScreenEnabled, isLoading } = usePermissions()

	if (isLoading) {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	// No grant for this screen/action — the member may have it assigned (it shows
	// in the sidebar) but the permission hasn't been turned on yet.
	if (!can(screen, action)) {
		return (
			<Forbidden
				title='403 — No access'
				message="You don't have access to this screen yet."
			/>
		)
	}

	// Granted, but the screen is killed (emergency switch) for non-admins.
	if (!isScreenEnabled(screen)) {
		return (
			<Forbidden
				title='Temporarily unavailable'
				message='This screen is temporarily unavailable.'
			/>
		)
	}

	return <Outlet />
}
