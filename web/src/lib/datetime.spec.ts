import { enUS, ptBR } from 'date-fns/locale'

import { formatDate, formatDateTime, formatTime } from './datetime'

const ISO = '2026-06-26T16:57:00.000Z'

// Assertions check locale *structure* (month order, separators, 12h/24h clock),
// not the exact day — so they stay green regardless of the host timezone.
describe('datetime formatting', () => {
	it('formats a medium date per locale', () => {
		// en-US: "Jun 26, 2026"
		expect(formatDate(ISO, enUS)).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/)
		// pt-BR: "26 jun 2026" (day-first, no comma)
		expect(formatDate(ISO, ptBR)).toMatch(/^\d{1,2} \w+\.? \d{4}$/)
	})

	it('differs between en-US and pt-BR', () => {
		expect(formatDate(ISO, enUS)).not.toBe(formatDate(ISO, ptBR))
	})

	it('uses a 12h clock for en-US and 24h for pt-BR', () => {
		expect(formatTime(ISO, enUS)).toMatch(/[AP]M/)
		expect(formatTime(ISO, ptBR)).not.toMatch(/[AP]M/)
	})

	it('combines date and time', () => {
		const en = formatDateTime(ISO, enUS)
		expect(en).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4} /)
		expect(en).toMatch(/[AP]M$/)
	})
})
