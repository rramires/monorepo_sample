import { z } from 'zod'

import { setZodLocale } from './zod-locale'

function firstError(schema: z.ZodType, value: unknown): string {
	const result = schema.safeParse(value)
	expect(result.success).toBe(false)
	return result.error!.issues[0].message
}

describe('Zod locale maps', () => {
	afterEach(() => {
		// Reset the global Zod locale so other suites see English.
		setZodLocale('en')
	})

	it('localizes min-length messages', () => {
		const schema = z.string().min(3)

		setZodLocale('en')
		expect(firstError(schema, 'ab')).toBe('Must be at least 3 characters.')

		setZodLocale('pt-BR')
		expect(firstError(schema, 'ab')).toBe(
			'Deve ter pelo menos 3 caracteres.',
		)
	})

	it('treats a min(1) string as required', () => {
		const schema = z.string().min(1)

		setZodLocale('en')
		expect(firstError(schema, '')).toBe('This field is required.')

		setZodLocale('pt-BR')
		expect(firstError(schema, '')).toBe('Este campo é obrigatório.')
	})

	it('localizes email format messages', () => {
		const schema = z.email()

		setZodLocale('en')
		expect(firstError(schema, 'nope')).toBe('Invalid email address.')

		setZodLocale('pt-BR')
		expect(firstError(schema, 'nope')).toBe('E-mail inválido(a).')
	})

	it('respects inline schema messages over the locale map', () => {
		// The precedence trap: an inline message always wins.
		const schema = z.string().min(3, 'Custom inline message.')

		setZodLocale('pt-BR')
		expect(firstError(schema, 'ab')).toBe('Custom inline message.')
	})
})
