import { expect, type Page, test } from '@playwright/test'

import { waitForUIInspection } from './e2e-utils'

async function signIn(page: Page, identifier: string) {
	await page.goto('/sign-in')
	await page.getByLabel('Email or username').fill(identifier)
	await page.getByLabel('Password').fill('Password1!')
	await page.getByRole('button', { name: 'Sign in' }).click()
	await expect(page).toHaveURL('/')
}

test('admin creates, edits and deletes a notice', async ({ page }) => {
	await signIn(page, 'admin')

	// O link Notices está na sidebar (tela semeada + NAV_ENTRIES).
	await page.getByRole('link', { name: 'Notices' }).click()
	await expect(page).toHaveURL('/notices')

	// ── Create ──────────────────────────────────────────────────────────────
	await page.getByRole('button', { name: 'New notice' }).click()
	await page.getByLabel('Title').fill('Lockers being replaced')
	// Radix Select: abre o combobox e escolhe a opção.
	await page.getByRole('combobox').click()
	await page.getByRole('option', { name: 'Urgent' }).click()
	await page.getByRole('button', { name: 'Create notice' }).click()

	await expect(page.getByText('Notice created.')).toBeVisible()
	await expect(
		page.getByText('Lockers being replaced', { exact: true }),
	).toBeVisible()

	// ── Edit ──────────────────────────────────────────────────────────────────
	// Botões de linha são ícone-only (sem nome acessível): selecione posicional —
	// .first() = Editar (lápis), .nth(1) = Excluir (lixeira).
	const row = page
		.getByRole('row')
		.filter({ hasText: 'Lockers being replaced' })
	await row.getByRole('button').first().click()

	// Cold-load: o input de título carrega o valor armazenado na abertura.
	await expect(page.getByLabel('Title')).toHaveValue('Lockers being replaced')
	await page.getByLabel('Title').fill('Lockers replaced — done')
	await page.getByRole('button', { name: 'Save changes' }).click()

	await expect(page.getByText('Notice updated.')).toBeVisible()
	await expect(
		page.getByText('Lockers replaced — done', { exact: true }),
	).toBeVisible()

	// ── Delete ──────────────────────────────────────────────────────────────
	const updatedRow = page
		.getByRole('row')
		.filter({ hasText: 'Lockers replaced — done' })
	await updatedRow.getByRole('button').nth(1).click()
	await expect(
		page.getByText(/Delete "Lockers replaced — done"\?/),
	).toBeVisible()
	await page.getByRole('button', { name: 'Delete' }).click()

	await expect(page.getByText('Notice deleted.')).toBeVisible()
	await expect(
		page.getByText('Lockers replaced — done', { exact: true }),
	).toHaveCount(0)

	await waitForUIInspection(page)
})

test('a member does not see the Notices menu item', async ({ page }) => {
	await signIn(page, 'johndoe')

	// johndoe é membro — sem membership em notices, logo sem link na sidebar.
	await expect(page.getByRole('link', { name: 'Notices' })).toHaveCount(0)

	await waitForUIInspection(page)
})
