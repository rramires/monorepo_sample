import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { getProfile } from '@/api/profiles'

import { renderWithProviders } from '../../../../../../test/utils'
import { ProfileDetail } from './profile-detail'

// happy-dom lacks the pointer-capture / scroll APIs Radix Popover + cmdk touch.
beforeAll(() => {
	const proto = Element.prototype as unknown as Record<string, unknown>
	proto.hasPointerCapture ??= () => false
	proto.setPointerCapture ??= () => {}
	proto.releasePointerCapture ??= () => {}
	proto.scrollIntoView ??= () => {}
})

// Two modules' worth of screens; the profile grants one access-control screen.
vi.mock('@/api/modules', () => ({
	getModules: vi.fn(async () => [
		{
			id: 'm-ac',
			key: 'access-control',
			name: 'Access Control',
			description: null,
			order: 0,
			isSystem: true,
		},
		{
			id: 'm-gym',
			key: 'gym',
			name: 'Gym',
			description: null,
			order: 1,
			isSystem: false,
		},
	]),
}))

vi.mock('@/api/screens', () => ({
	getScreens: vi.fn(async () => [
		{
			id: 's-ac-modules',
			moduleId: 'm-ac',
			key: 'access-control.modules',
			name: 'Manage Modules',
			path: '/admin/modules',
			description: null,
			order: 0,
			isSystem: true,
		},
		{
			id: 's-ac-screens',
			moduleId: 'm-ac',
			key: 'access-control.screens',
			name: 'Manage Screens',
			path: '/admin/screens',
			description: null,
			order: 1,
			isSystem: true,
		},
		{
			id: 's-gym-dash',
			moduleId: 'm-gym',
			key: 'gym.dashboard',
			name: 'Gym Dashboard',
			path: '/',
			description: null,
			order: 0,
			isSystem: false,
		},
	]),
}))

vi.mock('@/api/profiles', () => ({
	getProfile: vi.fn(async (id: string) => ({
		id,
		key: 'member',
		name: 'Gym Member',
		description: null,
		isSystem: false,
		isDefault: false,
		// Grants one access-control screen, so it sits on the Granted side.
		screens: [
			{
				screenId: 's-ac-modules',
				view: true,
				create: false,
				edit: false,
				delete: false,
				isDefault: false,
			},
		],
	})),
	setProfileScreens: vi.fn(async () => {}),
	updateProfile: vi.fn(async () => ({})),
	// Two profiles: p1 (this page, not default) + p2 the current default.
	getProfiles: vi.fn(async () => [
		{
			id: 'p1',
			key: 'member',
			name: 'Gym Member',
			description: null,
			isSystem: false,
			isDefault: false,
		},
		{
			id: 'p2',
			key: 'manager',
			name: 'Gym Manager',
			description: null,
			isSystem: false,
			isDefault: true,
		},
	]),
}))

// Grant edit so the table renders fully enabled.
vi.mock('@/hooks/use-permissions', () => ({
	usePermissions: () => ({ can: () => true }),
}))

function renderDetail() {
	return renderWithProviders(
		<Routes>
			<Route
				path='/admin/profiles/:profileId'
				element={<ProfileDetail />}
			/>
		</Routes>,
		{ route: '/admin/profiles/p1' },
	)
}

describe('ProfileDetail — grants module filter + column', () => {
	it('shows a Module column on both the Available and Granted sides', async () => {
		renderDetail()

		await screen.findByText('Gym Dashboard')

		expect(
			screen.getAllByRole('columnheader', { name: 'Module' }),
		).toHaveLength(2)
	})

	it('filters only the Available side by the chosen modules', async () => {
		const user = userEvent.setup()
		renderDetail()

		// Available starts with the unassigned access-control + gym screens;
		// the granted access-control screen sits on the Granted side.
		await screen.findByText('Manage Screens')
		expect(screen.getByText('Gym Dashboard')).toBeInTheDocument()
		expect(screen.getByText('Manage Modules')).toBeInTheDocument() // granted

		// Pick "Gym" in the chips filter.
		await user.click(screen.getByRole('combobox'))
		const gymOption = screen
			.getAllByText('Gym')
			.find((el) => el.closest('[data-slot="command-item"]'))
		await user.click(gymOption!)

		// Available now only shows the gym screen; the unassigned
		// access-control screen is filtered out…
		await waitFor(() =>
			expect(
				screen.queryByText('Manage Screens'),
			).not.toBeInTheDocument(),
		)
		expect(screen.getByText('Gym Dashboard')).toBeInTheDocument()
		// …but the granted access-control screen stays on the Granted side.
		expect(screen.getByText('Manage Modules')).toBeInTheDocument()
	})
})

describe('ProfileDetail — single-default invariant', () => {
	it('confirms replacing the current default when promoting this profile', async () => {
		const user = userEvent.setup()
		renderDetail()

		await screen.findByText('Gym Dashboard')

		// Turn this (non-default) profile into the default, then save.
		await user.click(screen.getByRole('switch'))
		await user.click(screen.getByRole('button', { name: 'Save changes' }))

		// The confirm dialog names the current default profile.
		expect(
			await screen.findByText(
				/The current default profile is: Gym Manager/,
			),
		).toBeInTheDocument()
	})

	it('disables the Default switch when this profile is already the default', async () => {
		vi.mocked(getProfile).mockResolvedValueOnce({
			id: 'p1',
			key: 'member',
			name: 'Gym Member',
			description: null,
			isSystem: false,
			isDefault: true,
			screens: [],
		})
		renderDetail()

		await screen.findByText('Gym Dashboard')

		expect(screen.getByRole('switch')).toBeDisabled()
		expect(
			screen.getByText(/This is the default profile/),
		).toBeInTheDocument()
	})
})
