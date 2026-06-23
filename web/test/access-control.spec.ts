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

	// The TransferTable is present (Granted side carries action columns).
	await expect(page.getByText('Screen grants')).toBeVisible()
	await expect(
		page.getByRole('columnheader', { name: 'View' }),
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
