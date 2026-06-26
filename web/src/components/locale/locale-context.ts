import { createContext } from 'react'

import type { AppLocale } from '@/i18n'

export type LocaleProviderState = {
	locale: AppLocale
	setLocale: (locale: AppLocale) => void
}

export const LocaleProviderContext = createContext<
	LocaleProviderState | undefined
>(undefined)
