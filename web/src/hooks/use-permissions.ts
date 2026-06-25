import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getMePermissions } from '@/api/get-me-permissions'
import { useAuth } from '@/components/auth/auth-hooks'

export type ScreenAction = 'view' | 'create' | 'edit' | 'delete'

// Loads the current user's effective permissions and exposes a `can()` helper.
// Server state, so it's a TanStack Query (keyed by user id → a different demo
// user refetches). ADMIN bypasses everything. While loading, `can()` is
// conservative (false) so nothing flashes before grants resolve.
export function usePermissions() {
	const { user, status } = useAuth()

	const query = useQuery({
		queryKey: ['me-permissions', user?.id],
		queryFn: getMePermissions,
		enabled: status === 'authed' && !!user,
		staleTime: 5 * 60 * 1000,
	})

	const byKey = useMemo(() => {
		const map = new Map<string, (action: ScreenAction) => boolean>()
		for (const s of query.data?.screens ?? []) {
			map.set(s.screenKey, (action) => s[action])
		}
		return map
	}, [query.data])

	// Kill switch per screen, from the membership menu. A screen the user is a
	// member of but isn't in the menu (no path) defaults to enabled.
	const enabledByKey = useMemo(() => {
		const map = new Map<string, boolean>()
		for (const m of query.data?.menu ?? []) {
			map.set(m.screenKey, m.isEnabled)
		}
		return map
	}, [query.data])

	const isAdmin = user?.role === 'ADMIN'

	function can(screenKey: string, action: ScreenAction = 'view'): boolean {
		if (isAdmin) {
			return true
		}
		return byKey.get(screenKey)?.(action) ?? false
	}

	// The screen kill switch (Screen.is_enabled). Admin ignores it; unknown
	// screens are treated as enabled (the `can()` check gates access first).
	function isScreenEnabled(screenKey: string): boolean {
		if (isAdmin) {
			return true
		}
		return enabledByKey.get(screenKey) ?? true
	}

	return {
		can,
		isScreenEnabled,
		isAdmin,
		isLoading: query.isLoading,
		permissions: query.data,
	}
}
