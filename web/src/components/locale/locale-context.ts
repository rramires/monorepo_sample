import type { Locale } from 'date-fns'
import { createContext } from 'react'

import type { AppLocale } from '@/i18n'

export type LocaleProviderState = {
	locale: AppLocale
	setLocale: (locale: AppLocale) => void
	/** date-fns locale for the active language (date/time formatting). */
	dateLocale: Locale
}

export const LocaleProviderContext = createContext<
	LocaleProviderState | undefined
>(undefined)
