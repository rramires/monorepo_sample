import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import enAccount from './locales/en/account.json'
import enAuth from './locales/en/auth.json'
import enCheckIns from './locales/en/check-ins.json'
import enCommon from './locales/en/common.json'
import ptBRAccount from './locales/pt-BR/account.json'
import ptBRAuth from './locales/pt-BR/auth.json'
import ptBRCheckIns from './locales/pt-BR/check-ins.json'
import ptBRCommon from './locales/pt-BR/common.json'
import { setZodLocale } from './zod-locale'

export const SUPPORTED_LOCALES = ['en', 'pt-BR'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const FALLBACK_LOCALE: AppLocale = 'en'
export const STORAGE_KEY = 'vite-ui-locale'
export const DEFAULT_NS = 'common'

/** Map any raw language tag (navigator, storage) onto a supported locale. */
export function normalizeLocale(lng?: string | null): AppLocale {
	return lng?.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

export const resources = {
	en: {
		common: enCommon,
		auth: enAuth,
		account: enAccount,
		'check-ins': enCheckIns,
	},
	'pt-BR': {
		common: ptBRCommon,
		auth: ptBRAuth,
		account: ptBRAccount,
		'check-ins': ptBRCheckIns,
	},
} as const

i18n.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: FALLBACK_LOCALE,
		supportedLngs: SUPPORTED_LOCALES,
		defaultNS: DEFAULT_NS,
		ns: [DEFAULT_NS, 'auth', 'account', 'check-ins'],
		interpolation: {
			// React already escapes; double-escaping mangles names with markup.
			escapeValue: false,
		},
		detection: {
			order: ['localStorage', 'navigator'],
			lookupLocalStorage: STORAGE_KEY,
			caches: ['localStorage'],
		},
		react: {
			// Static JSON resources load synchronously — no Suspense needed.
			useSuspense: false,
		},
	})

/** Keep `<html lang>` and the Zod locale in lockstep with the active language. */
function syncSideEffects(lng: string): void {
	const locale = normalizeLocale(lng)
	document.documentElement.lang = locale
	setZodLocale(locale)
}

syncSideEffects(i18n.resolvedLanguage ?? FALLBACK_LOCALE)
i18n.on('languageChanged', syncSideEffects)

export default i18n
