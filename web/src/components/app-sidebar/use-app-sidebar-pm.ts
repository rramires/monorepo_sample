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
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { useAuth } from '@/components/auth/auth-hooks'
import { useSidebar } from '@/components/ui/sidebar'
import { usePermissions } from '@/hooks/use-permissions'

// The screens that have a real page today, with their nav icon + the `nav`
// translation key for their short menu label (decoupled from the catalog's
// longer screen name). A screen only becomes a nav link once it's listed here
// (implemented) AND it appears in the user's menu (viewable, from
// /me/permissions) — so the menu grows as the remaining pages get built.
type NavLabelKey =
	| 'dashboard'
	| 'gyms'
	| 'checkIns'
	| 'modules'
	| 'screens'
	| 'profiles'
	| 'users'

const NAV_ENTRIES: Record<string, { icon: LucideIcon; labelKey: NavLabelKey }> =
	{
		'gym.dashboard': { icon: LayoutDashboard, labelKey: 'dashboard' },
		'gym.gyms': { icon: Dumbbell, labelKey: 'gyms' },
		'gym.check-ins': { icon: History, labelKey: 'checkIns' },
		'access-control.modules': { icon: Boxes, labelKey: 'modules' },
		'access-control.screens': {
			icon: MonitorSmartphone,
			labelKey: 'screens',
		},
		'access-control.profiles': { icon: ShieldCheck, labelKey: 'profiles' },
		'access-control.users': { icon: Users, labelKey: 'users' },
	}

export interface NavItem {
	key: string
	to: string
	label: string
	icon: LucideIcon
}

// A nav item stays active on its sub-routes (e.g. "Gyms" while on /gyms/new,
// "Users" while editing /admin/users/:id) — exact equality would drop the
// highlight on every detail page. Dashboard ("/") must match only itself, or it
// would light up everywhere.
export function isItemActive(pathname: string, to: string): boolean {
	if (to === '/') {
		return pathname === '/'
	}
	return pathname === to || pathname.startsWith(`${to}/`)
}

export interface NavSection {
	key: string
	label: string
	items: NavItem[]
}

export function useAppSidebarPM() {
	const { user, signOut } = useAuth()
	const { t, i18n } = useTranslation(['nav', 'catalog'])
	const { isLoading: permsLoading, permissions } = usePermissions()
	const { setOpenMobile } = useSidebar()
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
					// Module names are DB-sourced catalog: translate by key,
					// falling back to the stored name (admin-created modules).
					label: t(`catalog:modules.${item.moduleKey}.name`, {
						defaultValue: item.moduleName,
					}),
					items: [],
				}
				byModule.set(item.moduleKey, section)
			}
			section.items.push({
				key: item.screenKey,
				to: item.path,
				label: t(entry.labelKey),
				icon: entry.icon,
			})
		}

		return [...byModule.values()].filter((s) => s.items.length > 0)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [permissions?.menu, i18n.language])

	async function handleSignOut() {
		await signOut()
		navigate('/sign-in')
	}

	return {
		user,
		sections,
		isLoading: permsLoading,
		isActive: (to: string) => isItemActive(location.pathname, to),
		handleSignOut,
		// On mobile the sidebar is an overlay Sheet — navigating should dismiss
		// it so the chosen screen is visible (no-op on tablet/desktop). Lives in
		// the PM so the view stays logic-free.
		closeMobile: () => setOpenMobile(false),
	}
}
