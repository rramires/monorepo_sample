import type { MePermissions } from '@root/contracts'
import { HttpResponse } from 'msw'

import {
	modules,
	permissions,
	profileDefaultScreen,
	profilePermissions,
	profileScreens,
	screens,
	userDefaultScreen,
	userProfiles,
} from './data/access-control-seed'
import { findUser } from './users-data'

// Resolve the landing screen: user override (if viewable) → the profile default
// screen with the smallest (module order, screen order) the user can view → null.
function resolveDefaultScreen(
	userId: string,
	viewableKeys: Set<string>,
): string | null {
	const override = userDefaultScreen[userId]
	if (override && viewableKeys.has(override)) {
		return override
	}

	const screenById = new Map(screens.map((s) => [s.id, s]))
	const moduleOrder = new Map(modules.map((m) => [m.id, m.order]))
	const myProfileIds = userProfiles
		.filter((up) => up.user_id === userId)
		.map((up) => up.profile_id)

	let best: string | null = null
	let bestRank = [Infinity, Infinity]
	for (const pid of myProfileIds) {
		const landingId = profileDefaultScreen[pid]
		if (!landingId) {
			continue
		}
		const screen = screenById.get(landingId)
		if (!screen || !viewableKeys.has(screen.key)) {
			continue
		}
		const rank = [
			moduleOrder.get(screen.module_id) ?? Infinity,
			screen.order,
		]
		if (
			rank[0] < bestRank[0] ||
			(rank[0] === bestRank[0] && rank[1] < bestRank[1])
		) {
			best = screen.key
			bestRank = rank
		}
	}
	return best
}

// Build the menu (sidebar) for a user: every navigable screen (has a `path`) the
// user is a MEMBER of — shown even without a `view` grant (staged rollout) or
// while killed; the kill switch travels as `is_enabled` so the guard can pick
// the right Forbidden message. Grouped/ordered by (module order, screen order).
// Mirrors the backend so the sidebar never fetches the admin-gated catalog.
function buildMenu(membershipKeys: Set<string>): MePermissions['menu'] {
	const moduleById = new Map(modules.map((m) => [m.id, m]))
	return screens
		.filter((s) => s.path && membershipKeys.has(s.key))
		.map((s) => {
			const m = moduleById.get(s.module_id)
			return {
				screen_key: s.key,
				screen_name: s.name,
				path: s.path as string,
				screen_order: s.order,
				module_key: m?.key ?? '',
				module_name: m?.name ?? '',
				module_order: m?.order ?? 0,
				is_enabled: s.is_enabled,
			}
		})
		.sort(
			(a, b) =>
				a.module_order - b.module_order ||
				a.screen_order - b.screen_order,
		)
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock auth: a bearer token identifies a seeded user. The two legacy tokens are
// preserved (admin + the default member); any other demo user gets a token that
// carries its id so the permission/profile handlers can resolve who is calling.
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ID = 'mock-admin-id'
const DEFAULT_USER_ID = 'mock-user-id'

export function tokenFor(userId: string): string {
	if (userId === ADMIN_ID) {
		return 'mock-admin-jwt-token'
	}
	if (userId === DEFAULT_USER_ID) {
		return 'mock-jwt-token'
	}
	return `mock-jwt-token:${userId}`
}

// Reverse of tokenFor: the user id behind an Authorization header, or null when
// the token is missing/unknown.
export function userIdFromToken(authHeader: string | null): string | null {
	if (!authHeader?.startsWith('Bearer ')) {
		return null
	}
	const token = authHeader.slice('Bearer '.length)
	if (token === 'mock-admin-jwt-token') {
		return ADMIN_ID
	}
	if (token === 'mock-jwt-token') {
		return DEFAULT_USER_ID
	}
	if (token.startsWith('mock-jwt-token:')) {
		return token.slice('mock-jwt-token:'.length)
	}
	return null
}

// Any authenticated user passes. The access-control screens themselves are
// permission-gated on the frontend (Phase 2 `can()`) and on the backend later
// (Phase 5 `requireScreen`), so the mock only checks for a valid token. Returns
// a 401 response to short-circuit with, or null when the caller is authenticated.
export function requireAuth(authHeader: string | null) {
	if (!userIdFromToken(authHeader)) {
		return HttpResponse.json(
			{ code: 'unauthorized', message: 'Unauthorized.' },
			{ status: 401 },
		)
	}
	return null
}

// Add an action KEY to a screen's set in the actions-by-screen map.
function addAction(
	map: Map<string, Set<string>>,
	screenKey: string,
	action: string,
) {
	let set = map.get(screenKey)
	if (!set) {
		set = new Set<string>()
		map.set(screenKey, set)
	}
	set.add(action)
}

// Effective permissions for a user: ADMIN bypasses (every screen, every action);
// otherwise the membership (menu) + the OR of the user's granted permissions
// (effective ops as action keys), keyed by screen key. `view` is an explicit
// grant now and the kill switch is NOT folded into it (it rides on the menu as
// `is_enabled`).
export function computePermissions(userId: string): MePermissions | null {
	const user = findUser(userId)
	if (!user) {
		return null
	}

	const screenById = new Map(screens.map((s) => [s.id, s]))

	if (user.role === 'ADMIN') {
		const allKeys = new Set(screens.map((s) => s.key))
		// Admin carries every screen's full catalog of action keys (`can()`
		// bypasses regardless). Group the catalog by screen key.
		const actionsByKey = new Map<string, Set<string>>()
		for (const p of permissions) {
			const key = screenById.get(p.screen_id)?.key
			if (key) {
				addAction(actionsByKey, key, p.action)
			}
		}
		return {
			role: 'ADMIN',
			screens: screens.map((s) => ({
				screen_key: s.key,
				actions: [...(actionsByKey.get(s.key) ?? [])],
			})),
			menu: buildMenu(allKeys),
			default_screen_key: resolveDefaultScreen(userId, allKeys),
		}
	}

	const permById = new Map(permissions.map((p) => [p.id, p]))

	const myProfileIds = userProfiles
		.filter((up) => up.user_id === userId)
		.map((up) => up.profile_id)

	// Membership = union of the screens the user's profiles are assigned to.
	const membershipIds = new Set<string>()
	// Effective ops = union of granted permission ids resolved to (screen, action).
	const grantedPermIds = new Set<string>()
	for (const pid of myProfileIds) {
		for (const screenId of profileScreens[pid] ?? []) {
			membershipIds.add(screenId)
		}
		for (const permId of profilePermissions[pid] ?? []) {
			grantedPermIds.add(permId)
		}
	}

	// Effective ops per screen = the union of granted permission action keys.
	const actionsByKey = new Map<string, Set<string>>()
	for (const permId of grantedPermIds) {
		const perm = permById.get(permId)
		const screen = perm && screenById.get(perm.screen_id)
		if (!perm || !screen) {
			continue
		}
		addAction(actionsByKey, screen.key, perm.action)
	}

	const membershipKeys = new Set(
		[...membershipIds].map((id) => screenById.get(id)?.key).filter(Boolean),
	) as Set<string>
	const viewableKeys = new Set(
		[...actionsByKey.entries()]
			.filter(([, set]) => set.has('view'))
			.map(([key]) => key),
	)
	return {
		role: 'USER',
		screens: [...actionsByKey.entries()].map(([screen_key, set]) => ({
			screen_key,
			actions: [...set],
		})),
		menu: buildMenu(membershipKeys),
		default_screen_key: resolveDefaultScreen(userId, viewableKeys),
	}
}
