import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
	const { t } = useTranslation('auth')

	return (
		<>
			{pm.status === 'loading' && (
				<div className='flex flex-1 items-center justify-center p-8'>
					<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
				</div>
			)}

			{pm.status === 'no-access' && (
				<Forbidden
					title={t('forbidden.noAccessTitle')}
					message={t('forbidden.noAccessMessage')}
				/>
			)}

			{pm.status === 'disabled' && (
				<Forbidden
					title={t('forbidden.unavailableTitle')}
					message={t('forbidden.unavailableMessage')}
				/>
			)}

			{pm.status === 'allowed' && <Outlet />}
		</>
	)
}
