import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
}

test('admin navigates the access-control screens', async ({ page }) => {
	await signIn(page, 'admin')
	await expect(page).toHaveURL('/')

	for (const link of ['Modules', 'Screens', 'Profiles', 'Users']) {
		await page.getByRole('link', { name: link, exact: true }).click()
		await expect(
			page.getByRole('heading', { name: link, exact: true }),
		).toBeVisible()
	}

	await waitForUIInspection(page)
})

test('system modules and screens show a badge and hide Delete', async ({
	page,
}) => {
	await signIn(page, 'admin')

	// Modules: the access-control row is a system row (badge, Edit only — no
	// Delete); the gym row is deletable (Edit + Delete).
	await page.getByRole('link', { name: 'Modules', exact: true }).click()
	await expect(page).toHaveURL('/admin/modules')

	const systemModuleRow = page
		.getByRole('row')
		.filter({ hasText: 'access-control' })
	await expect(systemModuleRow.getByText('System')).toBeVisible()
	await expect(systemModuleRow.getByRole('button')).toHaveCount(1)

	const gymModuleRow = page.getByRole('row').filter({ hasText: 'gym' })
	await expect(gymModuleRow.getByText('System')).toHaveCount(0)
	await expect(gymModuleRow.getByRole('button')).toHaveCount(2)

	// Screens: same protection (a seeded access-control screen vs a gym screen).
	await page.getByRole('link', { name: 'Screens', exact: true }).click()
	await expect(page).toHaveURL('/admin/screens')

	const systemScreenRow = page
		.getByRole('row')
		.filter({ hasText: 'access-control.profiles' })
	await expect(systemScreenRow.getByText('System')).toBeVisible()
	// System screen: permission editor + Edit (no Delete).
	await expect(systemScreenRow.getByRole('button')).toHaveCount(2)

	const gymScreenRow = page
		.getByRole('row')
		.filter({ hasText: 'gym.dashboard' })
	await expect(gymScreenRow.getByText('System')).toHaveCount(0)
	// Gym screen: permission editor + Edit + Delete.
	await expect(gymScreenRow.getByRole('button')).toHaveCount(3)

	await waitForUIInspection(page)
})

test('admin edits a profile’s grants and saves', async ({ page }) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Profiles', exact: true }).click()
	await expect(page).toHaveURL('/admin/profiles')

	// Open the gym-member profile's grants.
	await page
		.getByRole('row')
		.filter({ hasText: 'gym-member' })
		.getByRole('link', { name: 'Grants' })
		.click()
	await expect(page).toHaveURL(/\/admin\/profiles\/.+/)

	// The TransferTable is present (Granted side carries a Permissions column of
	// badges instead of the old per-action checkboxes).
	await expect(page.getByText('Screen grants')).toBeVisible()
	await expect(
		page.getByRole('columnheader', { name: 'Permissions' }),
	).toBeVisible()

	await page.getByRole('button', { name: 'Save changes' }).click()
	await expect(page.getByText('Profile saved.')).toBeVisible()
	await expect(page).toHaveURL('/admin/profiles')

	await waitForUIInspection(page)
})

test('support lands on a permitted screen, not Forbidden', async ({ page }) => {
	await signIn(page, 'support')

	// Support has no gym.dashboard grant; the index redirects to their first
	// allowed screen instead of showing Forbidden.
	await expect(page).not.toHaveURL('/')
	await expect(
		page.getByRole('link', { name: 'Users', exact: true }),
	).toBeVisible()
	await expect(page.getByText('Forbidden')).toHaveCount(0)

	await waitForUIInspection(page)
})

test('admin adds a free-key (Other) op in the permission editor', async ({
	page,
}) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Screens', exact: true }).click()
	await expect(page).toHaveURL('/admin/screens')

	// Open the todo-style permission editor for the Dashboard screen.
	await page
		.getByRole('row')
		.filter({ hasText: 'gym.dashboard' })
		.getByRole('button', { name: 'Edit Dashboard permissions' })
		.click()

	const dialog = page.getByRole('dialog')
	await expect(dialog.getByText('Permissions — Dashboard')).toBeVisible()
	// Seeded with just the View op (op badge + its friendly label both read "View").
	await expect(dialog.getByText('View').first()).toBeVisible()

	// Operation → Other… reveals a Family select + a Name input that compose a
	// free key (create_export), previewed live before saving.
	await dialog.getByRole('combobox').first().click()
	await page.getByRole('option', { name: 'Other…' }).click()
	await dialog.getByRole('combobox').nth(1).click()
	await page.getByRole('option', { name: 'Create' }).click()
	await dialog.getByLabel('Key name').fill('export')
	await expect(dialog.getByText('→ create_export')).toBeVisible()
	await dialog.getByPlaceholder('e.g. Check in').fill('Export CSV')
	await dialog.getByRole('button', { name: 'Add permission' }).click()

	await expect(page.getByText('Permission added.')).toBeVisible()
	// The composed key shows as a raw-key badge alongside its friendly label.
	await expect(dialog.getByText('create_export')).toBeVisible()
	await expect(dialog.getByText('Export CSV')).toBeVisible()

	await waitForUIInspection(page)
})

test('the Check-in button on Gyms follows the create_checkin grant', async ({
	page,
}) => {
	// Member (johndoe) has gym.gyms.create_checkin but no edit grant → Check in
	// renders on each card, Edit does not. Kills the old cross-screen confusion.
	await signIn(page, 'johndoe')
	await page.getByRole('link', { name: 'Gyms', exact: true }).click()
	await expect(page).toHaveURL('/gyms')

	// Search by name so a card renders without depending on geolocation.
	await page.getByPlaceholder('Search gyms by name…').fill('Iron')
	await expect(page.getByText('Iron Temple')).toBeVisible()

	await expect(
		page.getByRole('button', { name: 'Check in' }).first(),
	).toBeVisible()
	await expect(page.getByRole('button', { name: 'Edit' })).toHaveCount(0)

	await waitForUIInspection(page)
})

test('a manager sees both Check in and Edit on Gyms', async ({ page }) => {
	// Manager adds the gym.gyms edit grant → both buttons render.
	await signIn(page, 'manager')
	await page.getByRole('link', { name: 'Gyms', exact: true }).click()
	await expect(page).toHaveURL('/gyms')

	await page.getByPlaceholder('Search gyms by name…').fill('Iron')
	await expect(page.getByText('Iron Temple')).toBeVisible()

	await expect(
		page.getByRole('button', { name: 'Check in' }).first(),
	).toBeVisible()
	await expect(
		page.getByRole('button', { name: 'Edit' }).first(),
	).toBeVisible()

	await waitForUIInspection(page)
})

test('admin turns a screen off via the kill switch (confirm)', async ({
	page,
}) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Screens', exact: true }).click()

	// Open the edit dialog (pencil) for the Dashboard screen.
	await page
		.getByRole('row')
		.filter({ hasText: 'gym.dashboard' })
		.getByRole('button')
		.nth(1)
		.click()

	const dialog = page.getByRole('dialog')
	await expect(dialog.getByText('Edit screen')).toBeVisible()

	// Flip the On (kill) switch off and save → a confirm appears first.
	await dialog.getByRole('switch', { name: 'On' }).click()
	await dialog.getByRole('button', { name: 'Save changes' }).click()

	await expect(page.getByText(/Turn "Dashboard" off\?/)).toBeVisible()
	await page.getByRole('button', { name: 'Turn off' }).click()

	await expect(page.getByText('Screen updated.')).toBeVisible()

	await waitForUIInspection(page)
})

test('a disabled screen is marked in a profile and confirms on removal', async ({
	page,
}) => {
	await signIn(page, 'admin')

	// Disable the Check-ins screen (gym.check-ins) via its edit dialog.
	await page.getByRole('link', { name: 'Screens', exact: true }).click()
	await page
		.getByRole('row')
		.filter({ hasText: 'gym.check-ins' })
		.getByRole('button')
		.nth(1)
		.click()
	const screenDialog = page.getByRole('dialog')
	await expect(screenDialog.getByText('Edit screen')).toBeVisible()
	await screenDialog.getByRole('switch', { name: 'Active' }).click()
	await screenDialog.getByRole('button', { name: 'Save changes' }).click()
	await expect(page.getByText(/Deactivate "Check-ins"\?/)).toBeVisible()
	await page.getByRole('button', { name: 'Deactivate' }).click()
	await expect(page.getByText('Screen updated.')).toBeVisible()

	// Open gym-member's grants — the disabled screen still sits on the Granted
	// side, marked "Disabled".
	await page.getByRole('link', { name: 'Profiles', exact: true }).click()
	await page
		.getByRole('row')
		.filter({ hasText: 'gym-member' })
		.getByRole('link', { name: 'Grants' })
		.click()
	await expect(page).toHaveURL(/\/admin\/profiles\/.+/)

	const grantedRow = page
		.getByRole('row')
		.filter({ hasText: 'gym.check-ins' })
	await expect(grantedRow.getByText('Disabled')).toBeVisible()

	// Removing it (one-way) prompts a confirm first.
	await grantedRow.getByRole('checkbox', { name: 'Select row' }).check()
	await page.getByRole('button', { name: 'Remove selected' }).click()
	await expect(page.getByText('Remove disabled screen')).toBeVisible()

	await waitForUIInspection(page)
})

test('admin deactivates a profile (confirm) and the list marks it Inactive', async ({
	page,
}) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Profiles', exact: true }).click()
	await page
		.getByRole('row')
		.filter({ hasText: 'support' })
		.getByRole('link', { name: 'Grants' })
		.click()
	await expect(page).toHaveURL(/\/admin\/profiles\/.+/)

	// Turn the profile's Active switch off → confirm → save.
	await page.getByRole('switch', { name: 'Active' }).click()
	await page.getByRole('button', { name: 'Save changes' }).click()
	await expect(page.getByText(/Deactivate "Support"\?/)).toBeVisible()
	await page.getByRole('button', { name: 'Deactivate' }).click()

	await expect(page.getByText('Profile saved.')).toBeVisible()
	await expect(page).toHaveURL('/admin/profiles')
	await expect(
		page
			.getByRole('row')
			.filter({ hasText: 'support' })
			.getByText('Inactive'),
	).toBeVisible()

	await waitForUIInspection(page)
})

test('deleting a module that still has screens is blocked with a message', async ({
	page,
}) => {
	await signIn(page, 'admin')

	await page.getByRole('link', { name: 'Modules', exact: true }).click()

	// gym is a non-system module (Edit + Delete) and still owns screens.
	await page
		.getByRole('row')
		.filter({ hasText: 'gym' })
		.getByRole('button')
		.nth(1)
		.click()
	await expect(page.getByText(/Delete "Gym"\?/)).toBeVisible()
	await page.getByRole('button', { name: 'Delete' }).click()

	await expect(page.getByText('Module still has screens.')).toBeVisible()

	await waitForUIInspection(page)
})
