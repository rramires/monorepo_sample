import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'

import i18n, { type AppLocale, normalizeLocale } from '@/i18n'

import { LocaleProviderContext } from './locale-context'

export function LocaleProvider({ children }: { children: ReactNode }) {
	const [locale, setLocale] = useState<AppLocale>(() =>
		normalizeLocale(i18n.resolvedLanguage),
	)

	useEffect(() => {
		// i18n owns the source of truth; mirror its language into React state so
		// the selector re-renders. `index.ts` already syncs <html lang> + Zod.
		const onChange = (lng: string) => setLocale(normalizeLocale(lng))
		i18n.on('languageChanged', onChange)
		return () => i18n.off('languageChanged', onChange)
	}, [])

	const value = {
		locale,
		setLocale: (next: AppLocale) => {
			i18n.changeLanguage(next)
		},
	}

	return (
		<I18nextProvider i18n={i18n}>
			<LocaleProviderContext.Provider value={value}>
				{children}
			</LocaleProviderContext.Provider>
		</I18nextProvider>
	)
}
