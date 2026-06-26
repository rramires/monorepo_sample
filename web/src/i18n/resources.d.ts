import 'i18next'

import type enCommon from './locales/en/common.json'

/**
 * Type-safe translation keys. `t('common:actions.save')` autocompletes and a
 * typo or missing key becomes a build error. `en` is the source of truth for the
 * key shape — `pt-BR` must mirror it. Extend `resources` as feature namespaces
 * land in later phases.
 */
declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'common'
		resources: {
			common: typeof enCommon
		}
	}
}
