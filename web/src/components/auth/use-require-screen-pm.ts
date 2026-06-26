import { type ScreenAction, usePermissions } from '@/hooks/use-permissions'

// Resolves what RequireScreen should render for a screen/action: a spinner while
// permissions load (or refetch), Forbidden when the grant is missing or the
// screen is killed, otherwise the child route.
export type RequireScreenStatus =
	| 'loading'
	| 'no-access'
	| 'disabled'
	| 'allowed'

export function useRequireScreenPM(
	screen: string,
	action: ScreenAction,
): { status: RequireScreenStatus } {
	const { can, isScreenEnabled, isLoading, isFetching } = usePermissions()

	// Gate on isFetching too: a background refetch (after a grant/kill change)
	// would otherwise flash a stale verdict before the fresh grants resolve.
	if (isLoading || isFetching) {
		return { status: 'loading' }
	}

	// No grant for this screen/action — the member may have it assigned (it shows
	// in the sidebar) but the permission hasn't been turned on yet.
	if (!can(screen, action)) {
		return { status: 'no-access' }
	}

	// Granted, but the screen is killed (emergency switch) for non-admins.
	if (!isScreenEnabled(screen)) {
		return { status: 'disabled' }
	}

	return { status: 'allowed' }
}
