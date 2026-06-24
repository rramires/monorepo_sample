import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, vi } from 'vitest'

import { updateUser } from '@/api/update-user'
import {
	AuthContext,
	type AuthContextValue,
} from '@/components/auth/auth-context'

import { renderWithProviders } from '../../../../../../test/utils'
import { UserEdit } from './user-edit'

// The edit page fetches the user by id; return a verified member.
vi.mock('@/api/get-user', () => ({
	getUser: vi.fn(async (id: string) => ({
		id,
		username: 'memberx',
		email: 'memberx@example.com',
		role: 'USER',
		is_verified: true,
		is_active: true,
		created_at: '2026-03-01T12:00:00.000Z',
		password_changed_at: null,
	})),
}))

// Stub the save so we can assert when (and with what) it's called.
vi.mock('@/api/update-user', () => ({
	updateUser: vi.fn(async () => ({})),
}))

beforeEach(() => {
	vi.clearAllMocks()
})

function renderEdit({
	selfId,
	targetId,
}: {
	selfId: string
	targetId: string
}) {
	const value: AuthContextValue = {
		status: 'authed',
		user: {
			id: selfId,
			username: 'admin',
			isVerified: true,
			role: 'ADMIN',
		},
		signIn: async () => {},
		signOut: async () => {},
		reloadUser: async () => {},
	}

	return renderWithProviders(
		<AuthContext.Provider value={value}>
			<Routes>
				<Route path='/admin/users/:userId' element={<UserEdit />} />
			</Routes>
		</AuthContext.Provider>,
		{ route: `/admin/users/${targetId}` },
	)
}

describe('UserEdit page', () => {
	it('shows the role read-only (no select) when editing your own account', async () => {
		renderEdit({ selfId: 'me', targetId: 'me' })

		expect(
			await screen.findByText("You can't change your own role."),
		).toBeInTheDocument()
		// Self-edit renders the role as a static badge, not an editable select.
		expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
	})

	it('seeds the form and allows changing the role of another user', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		expect(await screen.findByLabelText('Username')).toHaveValue('memberx')
		// Controller-bound fields must seed from the loaded user on first open.
		// Regression: role/verified came up blank, so the role failed validation
		// and Save silently did nothing.
		expect(screen.getByRole('combobox')).toHaveTextContent('Member')
		expect(
			screen.getByRole('switch', { name: 'Email verified' }),
		).toBeChecked()
		expect(
			screen.queryByText("You can't change your own role."),
		).not.toBeInTheDocument()
		expect(screen.getByRole('combobox')).toBeEnabled()
	})

	it('forces the verified toggle off when the email changes', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		const email = await screen.findByLabelText('Email')
		expect(
			screen.getByRole('switch', { name: 'Email verified' }),
		).toBeEnabled()

		await userEvent.clear(email)
		await userEvent.type(email, 'changed@example.com')

		expect(
			await screen.findByText(
				'Changing the email will unverify this account.',
			),
		).toBeInTheDocument()
		expect(
			screen.getByRole('switch', { name: 'Email verified' }),
		).toBeDisabled()
	})

	it('confirms before deactivating, then saves on confirm', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		const active = await screen.findByRole('switch', { name: 'Active' })
		expect(active).toBeChecked()
		await userEvent.click(active) // turn Active off

		await userEvent.click(
			screen.getByRole('button', { name: 'Save changes' }),
		)

		// The confirm dialog shows and nothing is saved yet.
		expect(
			await screen.findByText(/Deactivate memberx\?/),
		).toBeInTheDocument()
		expect(updateUser).not.toHaveBeenCalled()

		await userEvent.click(
			screen.getByRole('button', { name: 'Deactivate' }),
		)

		await waitFor(() =>
			expect(updateUser).toHaveBeenCalledWith('other-id', {
				is_active: false,
			}),
		)
	})

	it('saves a non-deactivating edit without prompting', async () => {
		renderEdit({ selfId: 'admin-id', targetId: 'other-id' })

		const username = await screen.findByLabelText('Username')
		await userEvent.clear(username)
		await userEvent.type(username, 'renamed')

		await userEvent.click(
			screen.getByRole('button', { name: 'Save changes' }),
		)

		await waitFor(() =>
			expect(updateUser).toHaveBeenCalledWith('other-id', {
				username: 'renamed',
			}),
		)
		expect(
			screen.queryByText(/Deactivate memberx\?/),
		).not.toBeInTheDocument()
	})
})
