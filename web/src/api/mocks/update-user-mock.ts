import { http, HttpResponse } from 'msw'

import type { UpdateUserBody } from '../update-user'
import { requireAuth } from './mock-auth'
import { findUser, users } from './users-data'

export const updateUserMock = http.patch<{ userId: string }, UpdateUserBody>(
	'/users/:userId',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}

		const body = await request.json()

		// At least one field (mirrors the backend .refine).
		if (
			body.username === undefined &&
			body.email === undefined &&
			body.role === undefined &&
			body.is_verified === undefined &&
			body.is_active === undefined
		) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Provide at least one field to update.' },
				{ status: 400 },
			)
		}

		// Can't verify a brand-new (unproven) email in the same request.
		if (body.email !== undefined && body.is_verified === true) {
			return HttpResponse.json(
				{
					code: 'validation_error',
					message:
						'Cannot verify a newly-changed email in the same request.',
				},
				{ status: 400 },
			)
		}

		const user = findUser(params.userId)
		if (!user) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}

		// The acting admin is mock-admin-id; they can't change their own role.
		if (
			params.userId === 'mock-admin-id' &&
			body.role !== undefined &&
			body.role !== user.role
		) {
			return HttpResponse.json(
				{ code: 'cannot_change_own_role', message: 'You cannot change your own role.' },
				{ status: 400 },
			)
		}

		const nextUsername = body.username?.toLowerCase()
		// Uniqueness (excluding the user being edited). The backend reuses the
		// same error for username and email conflicts.
		const conflict = users.some(
			(other) =>
				other.id !== user.id &&
				((nextUsername !== undefined &&
					other.username === nextUsername) ||
					(body.email !== undefined && other.email === body.email)),
		)
		if (conflict) {
			return HttpResponse.json(
				{ code: 'email_already_exists', message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		if (nextUsername !== undefined) {
			user.username = nextUsername
		}
		if (body.role !== undefined) {
			user.role = body.role
		}
		if (body.email !== undefined) {
			user.email = body.email
			// Changing the email unverifies the account until it's confirmed.
			user.is_verified = false
		}
		if (body.is_verified !== undefined) {
			user.is_verified = body.is_verified
		}
		if (body.is_active !== undefined) {
			user.is_active = body.is_active
		}

		return HttpResponse.json({ user })
	},
)
