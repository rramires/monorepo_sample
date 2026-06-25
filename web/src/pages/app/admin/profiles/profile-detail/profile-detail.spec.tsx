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
			isActive: true,
		},
		{
			id: 'm-gym',
			key: 'gym',
			name: 'Gym',
			description: null,
			order: 1,
			isSystem: false,
			isActive: true,
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
			isActive: true,
			isEnabled: true,
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
			isActive: true,
			isEnabled: true,
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
			isActive: true,
			isEnabled: true,
		},
	]),
}))

// Curated catalog: Manage Modules has the four ops; the others just `view`.
vi.mock('@/api/permissions', () => ({
	getPermissions: vi.fn(async () => [
		{
			id: 'p-acm-view',
			screenId: 's-ac-modules',
			action: 'view',
			label: 'View',
			isSystem: true,
		},
		{
			id: 'p-acm-add',
			screenId: 's-ac-modules',
			action: 'create',
			label: 'Add',
			isSystem: true,
		},
		{
			id: 'p-acm-edit',
			screenId: 's-ac-modules',
			action: 'edit',
			label: 'Edit',
			isSystem: true,
		},
		{
			id: 'p-acm-remove',
			screenId: 's-ac-modules',
			action: 'delete',
			label: 'Remove',
			isSystem: true,
		},
		{
			id: 'p-acs-view',
			screenId: 's-ac-screens',
			action: 'view',
			label: 'View',
			isSystem: true,
		},
		{
			id: 'p-dash-view',
			screenId: 's-gym-dash',
			action: 'view',
			label: 'View',
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
		isActive: true,
		defaultScreenId: null,
		// Membership: one access-control screen granted `view`, so it sits on the
		// Granted side.
		screens: [{ screenId: 's-ac-modules', permissionIds: ['p-acm-view'] }],
	})),
	setProfileGrants: vi.fn(async () => {}),
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
			isActive: true,
		},
		{
			id: 'p2',
			key: 'manager',
			name: 'Gym Manager',
			description: null,
			isSystem: false,
			isDefault: true,
			isActive: true,
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

		// The first combobox is the module filter (per-row permission selects sit
		// below it on the Granted side). Pick "Gym".
		await user.click(screen.getAllByRole('combobox')[0])
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

	it('shows a Permissions column with the granted screen permission badges', async () => {
		renderDetail()

		await screen.findByText('Manage Modules')

		expect(
			screen.getByRole('columnheader', { name: 'Permissions' }),
		).toBeInTheDocument()
		// The granted screen shows its granted permission label as a chip.
		expect(screen.getByText('View')).toBeInTheDocument()
	})
})

describe('ProfileDetail — single-default invariant', () => {
	it('confirms replacing the current default when promoting this profile', async () => {
		const user = userEvent.setup()
		renderDetail()

		await screen.findByText('Gym Dashboard')

		// Turn this (non-default) profile into the default, then save.
		await user.click(
			screen.getByRole('switch', { name: 'Default profile' }),
		)
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
			isActive: true,
			defaultScreenId: null,
			screens: [],
		})
		renderDetail()

		await screen.findByText('Gym Dashboard')

		expect(
			screen.getByRole('switch', { name: 'Default profile' }),
		).toBeDisabled()
		expect(
			screen.getByText(/This is the default profile/),
		).toBeInTheDocument()
	})
})
