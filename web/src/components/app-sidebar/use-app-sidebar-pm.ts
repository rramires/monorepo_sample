import { useQuery } from '@tanstack/react-query'
import {
	Dumbbell,
	History,
	LayoutDashboard,
	type LucideIcon,
	Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { getModules } from '@/api/get-modules'
import { getScreens } from '@/api/get-screens'
import { useAuth } from '@/components/auth/auth-hooks'
import { usePermissions } from '@/hooks/use-permissions'

// The screens that have a real page today, with their nav icon + a short menu
// label (decoupled from the catalog's longer screen name). A screen only becomes
// a nav link once it's listed here (implemented) AND the user `can()` view it —
// so the menu grows as Phase 4 builds the remaining admin pages.
const NAV_ENTRIES: Record<string, { icon: LucideIcon; label: string }> = {
	'gym.dashboard': { icon: LayoutDashboard, label: 'Dashboard' },
	'gym.gyms': { icon: Dumbbell, label: 'Gyms' },
	'gym.check-in': { icon: History, label: 'Check-ins' },
	'access-control.users': { icon: Users, label: 'Users' },
}

export interface NavItem {
	to: string
	label: string
	icon: LucideIcon
}

export interface NavSection {
	key: string
	label: string
	items: NavItem[]
}

export function useAppSidebarPM() {
	const { user, signOut, status } = useAuth()
	const { can } = usePermissions()
	const navigate = useNavigate()
	const location = useLocation()

	const enabled = status === 'authed'
	const modulesQuery = useQuery({
		queryKey: ['modules'],
		queryFn: getModules,
		enabled,
		staleTime: 5 * 60 * 1000,
	})
	const screensQuery = useQuery({
		queryKey: ['screens'],
		queryFn: () => getScreens(),
		enabled,
		staleTime: 5 * 60 * 1000,
	})

	// Build the nav from the catalog: modules (by order) → their viewable,
	// implemented screens (by order). Data-driven, so it mirrors the seed.
	const sections = useMemo<NavSection[]>(() => {
		const modules = modulesQuery.data ?? []
		const screens = screensQuery.data ?? []

		return modules
			.slice()
			.sort((a, b) => a.order - b.order)
			.map((module) => ({
				key: module.key,
				label: module.name,
				items: screens
					.filter((s) => s.moduleId === module.id)
					.filter((s) => s.path && NAV_ENTRIES[s.key])
					.filter((s) => can(s.key, 'view'))
					.sort((a, b) => a.order - b.order)
					.map((s) => ({
						to: s.path as string,
						label: NAV_ENTRIES[s.key].label,
						icon: NAV_ENTRIES[s.key].icon,
					})),
			}))
			.filter((section) => section.items.length > 0)
	}, [modulesQuery.data, screensQuery.data, can])

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		sections,
		pathname: location.pathname,
		handleSignOut,
	}
}
