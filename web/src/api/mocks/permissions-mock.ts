import {
	createPermissionBodySchema,
	type Permission,
	updatePermissionBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import {
	permissions,
	profilePermissions,
	screens,
} from './data/access-control-seed'
import { requireAuth } from './mock-auth'

let seq = 0
const nextId = () => `perm-new-${++seq}`

// GET /permissions?screen_id — the curated catalog (optionally one screen's).
export const listPermissionsMock = http.get('/permissions', ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}

	const screenId = new URL(request.url).searchParams.get('screen_id')
	const result = screenId
		? permissions.filter((p) => p.screen_id === screenId)
		: permissions
	return HttpResponse.json({ permissions: result })
})

// POST /screens/:screenId/permissions — add one curated op to a screen.
export const createPermissionMock = http.post<{ screenId: string }>(
	'/screens/:screenId/permissions',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const screen = screens.find((s) => s.id === params.screenId)
		if (!screen) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = createPermissionBodySchema.safeParse(
			await request.json(),
		)
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}

		// UNIQUE(screen_id, action): a screen offers each op at most once.
		const dup = permissions.some(
			(p) => p.screen_id === screen.id && p.action === parsed.data.action,
		)
		if (dup) {
			return HttpResponse.json(
				{
					code: 'duplicate_permission_action',
					message: `This screen already has a "${parsed.data.action}" permission.`,
					meta: { action: parsed.data.action },
				},
				{ status: 409 },
			)
		}

		// is_system mirrors the screen — a permission on a system screen is itself
		// protected.
		const permission: Permission = {
			id: nextId(),
			screen_id: screen.id,
			action: parsed.data.action,
			label: parsed.data.label,
			is_system: screen.is_system,
		}
		permissions.push(permission)
		return HttpResponse.json({ permission }, { status: 201 })
	},
)

// PATCH /permissions/:id — rename and/or re-target an op.
export const updatePermissionMock = http.patch<{ id: string }>(
	'/permissions/:id',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const permission = permissions.find((p) => p.id === params.id)
		if (!permission) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		const parsed = updatePermissionBodySchema.safeParse(
			await request.json(),
		)
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}

		const nextAction = parsed.data.action
		if (nextAction !== undefined && nextAction !== permission.action) {
			// A system permission's action is the code contract — locked.
			if (permission.is_system) {
				return HttpResponse.json(
					{
						code: 'system_permission',
						message:
							"A system permission's action cannot be changed.",
					},
					{ status: 409 },
				)
			}
			// UNIQUE(screen_id, action) still holds after a re-target.
			const dup = permissions.some(
				(p) =>
					p.screen_id === permission.screen_id &&
					p.action === nextAction,
			)
			if (dup) {
				return HttpResponse.json(
					{
						code: 'duplicate_permission_action',
						message: `This screen already has a "${nextAction}" permission.`,
						meta: { action: nextAction },
					},
					{ status: 409 },
				)
			}
		}

		Object.assign(permission, parsed.data)
		return HttpResponse.json({ permission })
	},
)

// DELETE /permissions/:id — no cascade: blocked while granted to any profile.
export const deletePermissionMock = http.delete<{ id: string }>(
	'/permissions/:id',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const index = permissions.findIndex((p) => p.id === params.id)
		if (index === -1) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// System permissions are protected from deletion.
		if (permissions[index].is_system) {
			return HttpResponse.json(
				{
					code: 'system_permission',
					message: 'A system permission cannot be deleted.',
				},
				{ status: 409 },
			)
		}

		// No cascade: a granted permission can't be deleted — remove it from the
		// profiles that hold it first.
		const granted = Object.values(profilePermissions).filter((ids) =>
			ids.includes(permissions[index].id),
		).length
		if (granted > 0) {
			return HttpResponse.json(
				{
					code: 'permission_in_use',
					message: `Granted to ${granted} profile(s). Remove it from those profiles first.`,
					meta: { count: granted },
				},
				{ status: 409 },
			)
		}

		permissions.splice(index, 1)
		return new HttpResponse(null, { status: 204 })
	},
)
