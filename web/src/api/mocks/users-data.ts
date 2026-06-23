import type { PublicUser } from '../get-users'

// Mutable mock state: the user directory the admin area reads and edits. Seeded
// with the two demo accounts (admin + johndoe, matching the profile mock) plus
// filler members so the list has a second page (page 1 = 20, page 2 = 3).
export const users: PublicUser[] = [
	{
		id: 'mock-admin-id',
		username: 'admin',
		email: 'admin@example.com',
		role: 'ADMIN',
		is_verified: true,
		is_active: true,
		created_at: '2026-01-01T12:00:00.000Z',
		password_changed_at: null,
	},
	{
		id: 'mock-user-id',
		username: 'johndoe',
		email: 'johndoe@example.com',
		role: 'USER',
		is_verified: false,
		is_active: true,
		created_at: '2026-02-01T12:00:00.000Z',
		password_changed_at: null,
	},
	// Access-control demo users: sign in as these to see the menu/guard change.
	{
		id: 'mock-manager-id',
		username: 'manager',
		email: 'manager@example.com',
		role: 'USER',
		is_verified: true,
		is_active: true,
		created_at: '2026-02-02T12:00:00.000Z',
		password_changed_at: null,
	},
	{
		id: 'mock-support-id',
		username: 'support',
		email: 'support@example.com',
		role: 'USER',
		is_verified: true,
		is_active: true,
		created_at: '2026-02-03T12:00:00.000Z',
		password_changed_at: null,
	},
	...Array.from({ length: 21 }, (_, index) => {
		const n = index + 3
		return {
			id: `mock-user-${n}`,
			username: `member${n}`,
			email: `member${n}@example.com`,
			role: 'USER' as const,
			is_verified: n % 2 === 0,
			// A couple of inactive accounts to show the disabled state.
			is_active: n % 7 !== 0,
			created_at: `2026-03-${String(n).padStart(2, '0')}T12:00:00.000Z`,
			password_changed_at: null,
		}
	}),
]

export function findUser(id: string) {
	return users.find((user) => user.id === id)
}
