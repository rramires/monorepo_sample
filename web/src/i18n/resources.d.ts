import 'i18next'

import type enAccount from './locales/en/account.json'
import type enAdmin from './locales/en/admin.json'
import type enAuth from './locales/en/auth.json'
import type enCatalog from './locales/en/catalog.json'
import type enCheckIns from './locales/en/check-ins.json'
import type enCommon from './locales/en/common.json'
import type enErrors from './locales/en/errors.json'
import type enGyms from './locales/en/gyms.json'
import type enNav from './locales/en/nav.json'
import type enNotices from './locales/en/notices.json'

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
			auth: typeof enAuth
			account: typeof enAccount
			'check-ins': typeof enCheckIns
			nav: typeof enNav
			catalog: typeof enCatalog
			gyms: typeof enGyms
			admin: typeof enAdmin
			errors: typeof enErrors
			notices: typeof enNotices
		}
	}
}
