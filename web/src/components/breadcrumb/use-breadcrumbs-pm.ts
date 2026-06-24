import { useMemo } from 'react'
import { matchPath, useLocation } from 'react-router'

import { useBreadcrumb } from './breadcrumb-hooks'

export interface Crumb {
	label: string
	// A linkable ancestor crumb; the leaf (current page) has no `to`.
	to?: string
}

// Static trail per route. The last crumb is the current page; earlier crumbs
// link back to their section. Keep this in sync with routes.tsx.
const STATIC_TRAILS: Record<string, Crumb[]> = {
	'/': [{ label: 'Dashboard' }],
	'/gyms': [{ label: 'Gyms' }],
	'/gyms/new': [{ label: 'Gyms', to: '/gyms' }, { label: 'New gym' }],
	'/check-ins': [{ label: 'Check-ins' }],
	'/account': [{ label: 'Account' }],
	'/admin/users': [{ label: 'Users' }],
	'/admin/modules': [{ label: 'Modules' }],
	'/admin/screens': [{ label: 'Screens' }],
	'/admin/profiles': [{ label: 'Profiles' }],
}

// Detail routes whose leaf label is the loaded entity's name (published via
// useSetBreadcrumb). `fallback` shows while the entity is still loading.
const DYNAMIC_TRAILS: {
	pattern: string
	parent: Crumb
	fallback: string
}[] = [
	{
		pattern: '/admin/users/:userId',
		parent: { label: 'Users', to: '/admin/users' },
		fallback: 'User',
	},
	{
		pattern: '/admin/profiles/:profileId',
		parent: { label: 'Profiles', to: '/admin/profiles' },
		fallback: 'Profile',
	},
]

function resolveTrail(pathname: string, dynamicLabel: string | null): Crumb[] {
	const exact = STATIC_TRAILS[pathname]
	if (exact) {
		return exact
	}

	for (const { pattern, parent, fallback } of DYNAMIC_TRAILS) {
		if (matchPath(pattern, pathname)) {
			return [parent, { label: dynamicLabel ?? fallback }]
		}
	}

	return []
}

export function useBreadcrumbsPM() {
	const { pathname } = useLocation()
	const { label } = useBreadcrumb()

	const crumbs = useMemo(
		() => resolveTrail(pathname, label),
		[pathname, label],
	)

	return { crumbs }
}
