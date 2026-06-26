import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'

import i18n from '@/i18n'

import { LanguageSelector } from './language-selector'
import { useLocale } from './locale-hooks'
import { LocaleProvider } from './locale-provider'

function Probe() {
	const { locale, setLocale } = useLocale()
	const { t } = useTranslation()
	return (
		<div>
			<span data-testid='locale'>{locale}</span>
			<span data-testid='label'>{t('actions.cancel')}</span>
			<button onClick={() => setLocale('pt-BR')}>to-pt</button>
			<button onClick={() => setLocale('en')}>to-en</button>
		</div>
	)
}

describe('LocaleProvider + selector', () => {
	afterEach(async () => {
		await i18n.changeLanguage('en')
		localStorage.clear()
	})

	it('defaults to English copy and html lang', () => {
		render(
			<LocaleProvider>
				<Probe />
			</LocaleProvider>,
		)

		expect(screen.getByTestId('locale')).toHaveTextContent('en')
		expect(screen.getByTestId('label')).toHaveTextContent('Cancel')
		expect(document.documentElement.lang).toBe('en')
	})

	it('switching to pt-BR flips copy, html lang, and persists', async () => {
		const user = userEvent.setup()
		render(
			<LocaleProvider>
				<Probe />
			</LocaleProvider>,
		)

		await user.click(screen.getByText('to-pt'))

		expect(await screen.findByText('Cancelar')).toBeInTheDocument()
		expect(screen.getByTestId('locale')).toHaveTextContent('pt-BR')
		expect(document.documentElement.lang).toBe('pt-BR')
		expect(localStorage.getItem('vite-ui-locale')).toBe('pt-BR')
	})

	it('renders an accessible language selector', () => {
		render(
			<LocaleProvider>
				<LanguageSelector />
			</LocaleProvider>,
		)

		expect(
			screen.getByRole('button', { name: 'Change language' }),
		).toBeInTheDocument()
	})
})
