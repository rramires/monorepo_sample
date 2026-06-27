import { isAxiosError } from 'axios'

import i18n from '@/i18n'

// Localize a backend error. The API serializes failures as `{ code, message,
// meta? }` (see @root/contracts); we map the stable `code` to the `errors`
// namespace and interpolate `meta` (retryAfter / count / action). The English
// `message` is a dev fallback only — used when a code arrives without a matching
// translation. With no code at all (a network/unknown error), we fall back to
// the caller's localized `fallback`.
export function messageFromError(err: unknown, fallback: string): string {
	const data = isAxiosError(err) ? err.response?.data : undefined
	const code: unknown = data?.code
	const message: unknown = data?.message

	if (typeof code === 'string') {
		// Dynamic key → i18next's loose overload widens the return; the runtime
		// value is always a string here (no returnObjects/returnDetails).
		return i18n.t(`errors:${code}`, {
			defaultValue: typeof message === 'string' ? message : fallback,
			...(data?.meta ?? {}),
		}) as string
	}

	return typeof message === 'string' ? message : fallback
}
