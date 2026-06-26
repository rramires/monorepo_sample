import { z } from 'zod'

import type { AppLocale } from './index'

/**
 * Handwritten Zod 4 locale error maps for `en` and `pt-BR`.
 *
 * Why handwritten? Zod ships `en` and `pt` (European Portuguese) but **no**
 * `pt-BR` — and European phrasing reads oddly to Brazilian users. Authoring both
 * maps in one place keeps the two voices parallel and lets us phrase messages as
 * user-facing form copy instead of Zod's debug-style defaults.
 *
 * Precedence (Zod 4): an inline schema message (`.min(3, 'msg')`) and a per-parse
 * error both win over `z.config({ localeError })`. So a form field only inherits
 * these messages if it does **not** carry an inline message — that is the
 * "precedence trap" the i18n plan calls out. Field-specific copy that must be
 * translated lives in the feature namespaces via `t()`; this map is the generic
 * catch-all for everything else.
 */

type ZodErrorMap = z.core.$ZodErrorMap

interface Strings {
	// type
	required: string
	invalidValue: string
	invalidType: (expected: string) => string
	// size (string)
	tooShortChars: (min: number) => string
	tooLongChars: (max: number) => string
	// size (collection)
	tooFewItems: (min: number) => string
	tooManyItems: (max: number) => string
	// size (number)
	tooSmall: (min: number, inclusive: boolean) => string
	tooBig: (max: number, inclusive: boolean) => string
	// formats
	invalidFormat: (label: string) => string
	startsWith: (prefix: string) => string
	endsWith: (suffix: string) => string
	includes: (needle: string) => string
	pattern: string
	notMultipleOf: (divisor: number) => string
	unrecognizedKeys: (count: number) => string
	// fallback
	invalidInput: string
	// dictionaries
	formats: Record<string, string>
}

function plural(n: number, one: string, many: string): string {
	return n === 1 ? one : many
}

const en: Strings = {
	required: 'This field is required.',
	invalidValue: 'Invalid value.',
	invalidType: (expected) => `Expected ${expected}.`,
	tooShortChars: (min) =>
		`Must be at least ${min} ${plural(min, 'character', 'characters')}.`,
	tooLongChars: (max) =>
		`Must be at most ${max} ${plural(max, 'character', 'characters')}.`,
	tooFewItems: (min) =>
		`Select at least ${min} ${plural(min, 'item', 'items')}.`,
	tooManyItems: (max) =>
		`Select at most ${max} ${plural(max, 'item', 'items')}.`,
	tooSmall: (min, inclusive) =>
		inclusive
			? `Must be greater than or equal to ${min}.`
			: `Must be greater than ${min}.`,
	tooBig: (max, inclusive) =>
		inclusive
			? `Must be less than or equal to ${max}.`
			: `Must be less than ${max}.`,
	invalidFormat: (label) => `Invalid ${label}.`,
	startsWith: (prefix) => `Must start with "${prefix}".`,
	endsWith: (suffix) => `Must end with "${suffix}".`,
	includes: (needle) => `Must include "${needle}".`,
	pattern: 'Invalid format.',
	notMultipleOf: (divisor) => `Must be a multiple of ${divisor}.`,
	unrecognizedKeys: (count) =>
		`Unrecognized ${plural(count, 'key', 'keys')}.`,
	invalidInput: 'Invalid input.',
	formats: {
		email: 'email address',
		url: 'URL',
		uuid: 'UUID',
		datetime: 'date and time',
		date: 'date',
		time: 'time',
		ipv4: 'IPv4 address',
		ipv6: 'IPv6 address',
	},
}

const ptBR: Strings = {
	required: 'Este campo é obrigatório.',
	invalidValue: 'Valor inválido.',
	invalidType: (expected) => `Esperado ${expected}.`,
	tooShortChars: (min) =>
		`Deve ter pelo menos ${min} ${plural(min, 'caractere', 'caracteres')}.`,
	tooLongChars: (max) =>
		`Deve ter no máximo ${max} ${plural(max, 'caractere', 'caracteres')}.`,
	tooFewItems: (min) =>
		`Selecione pelo menos ${min} ${plural(min, 'item', 'itens')}.`,
	tooManyItems: (max) =>
		`Selecione no máximo ${max} ${plural(max, 'item', 'itens')}.`,
	tooSmall: (min, inclusive) =>
		inclusive
			? `Deve ser maior ou igual a ${min}.`
			: `Deve ser maior que ${min}.`,
	tooBig: (max, inclusive) =>
		inclusive
			? `Deve ser menor ou igual a ${max}.`
			: `Deve ser menor que ${max}.`,
	invalidFormat: (label) => `${label} inválido(a).`,
	startsWith: (prefix) => `Deve começar com "${prefix}".`,
	endsWith: (suffix) => `Deve terminar com "${suffix}".`,
	includes: (needle) => `Deve incluir "${needle}".`,
	pattern: 'Formato inválido.',
	notMultipleOf: (divisor) => `Deve ser múltiplo de ${divisor}.`,
	unrecognizedKeys: (count) =>
		`${plural(count, 'Chave', 'Chaves')} não reconhecida(s).`,
	invalidInput: 'Entrada inválida.',
	formats: {
		email: 'E-mail',
		url: 'URL',
		uuid: 'UUID',
		datetime: 'Data e hora',
		date: 'Data',
		time: 'Hora',
		ipv4: 'Endereço IPv4',
		ipv6: 'Endereço IPv6',
	},
}

/** Origins that measure a length/size rather than a numeric magnitude. */
const STRING_ORIGINS = new Set(['string'])
const COLLECTION_ORIGINS = new Set(['array', 'set', 'file', 'map'])

function buildErrorMap(s: Strings): ZodErrorMap {
	return (issue) => {
		switch (issue.code) {
			case 'invalid_type': {
				if (issue.input === undefined) {
					return s.required
				}
				return s.invalidType(issue.expected)
			}
			case 'invalid_value':
				return s.invalidValue
			case 'too_small': {
				const min = Number(issue.minimum)
				if (STRING_ORIGINS.has(issue.origin)) {
					// A required-feeling min(1) reads better as "required".
					return min <= 1 ? s.required : s.tooShortChars(min)
				}
				if (COLLECTION_ORIGINS.has(issue.origin)) {
					return s.tooFewItems(min)
				}
				return s.tooSmall(min, issue.inclusive ?? true)
			}
			case 'too_big': {
				const max = Number(issue.maximum)
				if (STRING_ORIGINS.has(issue.origin)) {
					return s.tooLongChars(max)
				}
				if (COLLECTION_ORIGINS.has(issue.origin)) {
					return s.tooManyItems(max)
				}
				return s.tooBig(max, issue.inclusive ?? true)
			}
			case 'invalid_format': {
				const f = issue as unknown as {
					format: string
					prefix?: string
					suffix?: string
					includes?: string
				}
				if (f.format === 'starts_with' && f.prefix !== undefined) {
					return s.startsWith(f.prefix)
				}
				if (f.format === 'ends_with' && f.suffix !== undefined) {
					return s.endsWith(f.suffix)
				}
				if (f.format === 'includes' && f.includes !== undefined) {
					return s.includes(f.includes)
				}
				if (f.format === 'regex') {
					return s.pattern
				}
				return s.invalidFormat(s.formats[f.format] ?? f.format)
			}
			case 'not_multiple_of':
				return s.notMultipleOf(Number(issue.divisor))
			case 'unrecognized_keys':
				return s.unrecognizedKeys(issue.keys.length)
			default:
				return s.invalidInput
		}
	}
}

const errorMaps: Record<AppLocale, ZodErrorMap> = {
	en: buildErrorMap(en),
	'pt-BR': buildErrorMap(ptBR),
}

/** Point Zod's global locale error map at the active language. */
export function setZodLocale(locale: AppLocale): void {
	z.config({ localeError: errorMaps[locale] })
}
