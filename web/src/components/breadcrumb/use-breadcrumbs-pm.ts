import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { matchPath, useLocation } from 'react-router'

import { useBreadcrumb } from './breadcrumb-hooks'

export interface Crumb {
	label: string
	// A linkable ancestor crumb; the leaf (current page) has no `to`.
	to?: string
}

type NavKey =
	| 'dashboard'
	| 'gyms'
	| 'newGym'
	| 'checkIns'
	| 'account'
	| 'users'
	| 'modules'
	| 'screens'
	| 'profiles'
	| 'user'
	| 'profile'

// Static trail per route, by `nav` label key. The last crumb is the current
// page; earlier crumbs link back to their section. Keep this in sync with
// routes.tsx.
const STATIC_TRAILS: Record<string, { key: NavKey; to?: string }[]> = {
	'/': [{ key: 'dashboard' }],
	'/gyms': [{ key: 'gyms' }],
	'/gyms/new': [{ key: 'gyms', to: '/gyms' }, { key: 'newGym' }],
	'/check-ins': [{ key: 'checkIns' }],
	'/account': [{ key: 'account' }],
	'/admin/users': [{ key: 'users' }],
	'/admin/modules': [{ key: 'modules' }],
	'/admin/screens': [{ key: 'screens' }],
	'/admin/profiles': [{ key: 'profiles' }],
}

// Detail routes whose leaf label is the loaded entity's name (published via
// useSetBreadcrumb). `fallbackKey` shows while the entity is still loading.
const DYNAMIC_TRAILS: {
	pattern: string
	parent: { key: NavKey; to: string }
	fallbackKey: NavKey
}[] = [
	{
		pattern: '/admin/users/:userId',
		parent: { key: 'users', to: '/admin/users' },
		fallbackKey: 'user',
	},
	{
		pattern: '/admin/profiles/:profileId',
		parent: { key: 'profiles', to: '/admin/profiles' },
		fallbackKey: 'profile',
	},
]

function resolveTrail(
	pathname: string,
	dynamicLabel: string | null,
	t: TFunction<'nav'>,
): Crumb[] {
	const exact = STATIC_TRAILS[pathname]
	if (exact) {
		return exact.map(({ key, to }) => ({ label: t(key), to }))
	}

	for (const { pattern, parent, fallbackKey } of DYNAMIC_TRAILS) {
		if (matchPath(pattern, pathname)) {
			return [
				{ label: t(parent.key), to: parent.to },
				// The leaf is the loaded entity's name (user data — never
				// translated); the fallback label is.
				{ label: dynamicLabel ?? t(fallbackKey) },
			]
		}
	}

	return []
}

export function useBreadcrumbsPM() {
	const { pathname } = useLocation()
	const { label } = useBreadcrumb()
	const { t, i18n } = useTranslation('nav')

	const crumbs = useMemo(
		() => resolveTrail(pathname, label, t),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[pathname, label, i18n.language],
	)

	return { crumbs }
}
