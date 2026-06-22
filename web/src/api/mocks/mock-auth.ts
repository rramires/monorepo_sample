import type { MePermissions, ScreenPermission } from '@root/contracts'
import { HttpResponse } from 'msw'

import {
	profileScreens,
	screens,
	userProfiles,
} from './data/access-control-seed'
import { findUser } from './users-data'

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
		return HttpResponse.json({ message: 'Unauthorized.' }, { status: 401 })
	}
	return null
}

// Effective permissions for a user: ADMIN bypasses (every screen, every action);
// otherwise the OR of the user's profile grants, keyed by screen key.
export function computePermissions(userId: string): MePermissions | null {
	const user = findUser(userId)
	if (!user) {
		return null
	}

	if (user.role === 'ADMIN') {
		return {
			role: 'ADMIN',
			screens: screens.map((s) => ({
				screen_key: s.key,
				view: true,
				create: true,
				edit: true,
				delete: true,
			})),
		}
	}

	const keyById = new Map(screens.map((s) => [s.id, s.key]))
	const merged = new Map<string, ScreenPermission>()

	const myProfileIds = userProfiles
		.filter((up) => up.user_id === userId)
		.map((up) => up.profile_id)

	for (const profileId of myProfileIds) {
		for (const grant of profileScreens[profileId] ?? []) {
			const key = keyById.get(grant.screen_id)
			if (!key) {
				continue
			}
			const prev = merged.get(key) ?? {
				screen_key: key,
				view: false,
				create: false,
				edit: false,
				delete: false,
			}
			merged.set(key, {
				screen_key: key,
				view: prev.view || grant.can_view,
				create: prev.create || grant.can_create,
				edit: prev.edit || grant.can_edit,
				delete: prev.delete || grant.can_delete,
			})
		}
	}

	return { role: 'USER', screens: [...merged.values()] }
}
