import { useContext } from 'react'

import { LocaleProviderContext } from './locale-context'

export function useLocale() {
	const context = useContext(LocaleProviderContext)

	if (context === undefined) {
		throw new Error('useLocale must be used within a LocaleProvider')
	}

	return context
}
