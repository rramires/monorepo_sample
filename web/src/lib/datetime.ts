import { format, type Locale } from 'date-fns'

/**
 * Locale-aware date/time formatting.
 *
 * Dates are never stored in translation JSON — they are formatted at render time
 * from the active language's date-fns `Locale` (see `useLocale().dateLocale`).
 * Always use the **localized tokens** (`P`/`PP`/`PPP` for dates, `p`/`pp` for
 * times) so month order, separators, and 12h/24h clock follow each locale —
 * never hardcode `dd/MM/yyyy`.
 *
 * Timezone: `format` renders in the **browser's** local timezone, which is the
 * v1 behavior (no stored per-user tz). For a future per-user override, wrap the
 * date in `@date-fns/tz`'s `TZDate` (already a dependency) before formatting —
 * e.g. `format(new TZDate(iso, userTz), 'PP', { locale })`.
 *
 * Numbers: this app has no money field, so currency formatting is intentionally
 * absent. The doctrine when one appears: numbers/currency are **data, not
 * language** — format with `Intl.NumberFormat(localeTag, { style: 'currency',
 * currency })`, not translation strings. (The activity chart's plain
 * `toLocaleString()` count is fine as-is.)
 */

/** Medium date, e.g. "Jun 26, 2026" (en) / "26 de jun. de 2026" (pt-BR). */
export function formatDate(iso: string, locale: Locale): string {
	return format(new Date(iso), 'PP', { locale })
}

/** Short time, e.g. "4:57 PM" (en) / "16:57" (pt-BR). */
export function formatTime(iso: string, locale: Locale): string {
	return format(new Date(iso), 'p', { locale })
}

/** Medium date + short time. */
export function formatDateTime(iso: string, locale: Locale): string {
	const date = new Date(iso)
	return `${format(date, 'PP', { locale })} ${format(date, 'p', { locale })}`
}
