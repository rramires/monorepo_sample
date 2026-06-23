import {
	Boxes,
	Dumbbell,
	History,
	LayoutDashboard,
	type LucideIcon,
	MonitorSmartphone,
	ShieldCheck,
	Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'
import { usePermissions } from '@/hooks/use-permissions'

// The screens that have a real page today, with their nav icon + a short menu
// label (decoupled from the catalog's longer screen name). A screen only becomes
// a nav link once it's listed here (implemented) AND it appears in the user's
// menu (viewable, from /me/permissions) — so the menu grows as the remaining
// pages get built.
const NAV_ENTRIES: Record<string, { icon: LucideIcon; label: string }> = {
	'gym.dashboard': { icon: LayoutDashboard, label: 'Dashboard' },
	'gym.gyms': { icon: Dumbbell, label: 'Gyms' },
	'gym.check-in': { icon: History, label: 'Check-ins' },
	'access-control.modules': { icon: Boxes, label: 'Modules' },
	'access-control.screens': { icon: MonitorSmartphone, label: 'Screens' },
	'access-control.profiles': { icon: ShieldCheck, label: 'Profiles' },
	'access-control.users': { icon: Users, label: 'Users' },
}

export interface NavItem {
	key: string
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
	const { user, signOut } = useAuth()
	const { isLoading: permsLoading, permissions } = usePermissions()
	const navigate = useNavigate()
	const location = useLocation()

	// Build the nav from the menu in /me/permissions: it already carries only the
	// viewable screens, grouped/ordered by (module order, screen order). Keep the
	// implemented ones (NAV_ENTRIES) and group them by module, preserving order.
	const sections = useMemo<NavSection[]>(() => {
		const menu = permissions?.menu ?? []
		const byModule = new Map<string, NavSection>()

		for (const item of menu) {
			const entry = NAV_ENTRIES[item.screenKey]
			if (!entry) {
				continue
			}
			let section = byModule.get(item.moduleKey)
			if (!section) {
				section = {
					key: item.moduleKey,
					label: item.moduleName,
					items: [],
				}
				byModule.set(item.moduleKey, section)
			}
			section.items.push({
				key: item.screenKey,
				to: item.path,
				label: entry.label,
				icon: entry.icon,
			})
		}

		return [...byModule.values()].filter((s) => s.items.length > 0)
	}, [permissions?.menu])

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		sections,
		isLoading: permsLoading,
		pathname: location.pathname,
		handleSignOut,
	}
}
