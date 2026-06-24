import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

// A phone-sized viewport (< md) puts the sidebar into the overlay Sheet drawer.
test.use({ viewport: { width: 390, height: 844 } })

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('the mobile drawer closes after picking a nav item', async ({ page }) => {
	await signIn(page, 'johndoe')

	const drawer = page.getByRole('dialog')
	await expect(drawer).toBeHidden()

	// Open the drawer via the hamburger.
	await page.getByRole('button', { name: 'Toggle Sidebar' }).first().click()
	await expect(drawer).toBeVisible()

	// Picking an item navigates AND dismisses the drawer (the regression).
	await drawer.getByRole('link', { name: 'Gyms' }).click()
	await expect(page).toHaveURL('/gyms')
	await expect(drawer).toBeHidden()

	await waitForUIInspection(page)
})
