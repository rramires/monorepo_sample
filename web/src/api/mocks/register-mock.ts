import { http, HttpResponse } from 'msw'

import type { RegisterAccountBody } from '../register'
import { profiles, userProfiles } from './data/access-control-seed'
import { users } from './users-data'

let seq = 0
const nextId = () => `mock-registered-${++seq}`

export const registerMock = http.post<never, RegisterAccountBody>(
	'/users',
	async ({ request }) => {
		const { username, email } = await request.json()

		// Mock rule: this username is already taken.
		if (username === 'admin') {
			return HttpResponse.json(
				{ message: 'E-mail already exists.' },
				{ status: 409 },
			)
		}

		// Create the account and auto-attach the is_default profile, exactly like
		// the backend's POST /register will (PLAN §5).
		const id = nextId()
		users.push({
			id,
			username,
			email,
			role: 'USER',
			is_verified: false,
			created_at: '2026-06-22T12:00:00.000Z',
			password_changed_at: null,
		})
		const defaultProfile = profiles.find((p) => p.is_default)
		if (defaultProfile) {
			userProfiles.push({ user_id: id, profile_id: defaultProfile.id })
		}

		return HttpResponse.json(
			{ user: { id, username, email, role: 'USER' } },
			{ status: 201 },
		)
	},
)
