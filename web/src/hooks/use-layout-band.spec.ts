import { getBandForWidth } from './use-layout-band'

describe('getBandForWidth', () => {
	it('classifies mobile below md (768)', () => {
		expect(getBandForWidth(0)).toBe('mobile')
		expect(getBandForWidth(320)).toBe('mobile')
		expect(getBandForWidth(767)).toBe('mobile')
	})

	it('classifies tablet across md–lg (768–1023)', () => {
		expect(getBandForWidth(768)).toBe('tablet')
		expect(getBandForWidth(900)).toBe('tablet')
		expect(getBandForWidth(1023)).toBe('tablet')
	})

	it('classifies desktop at lg (1024) and up', () => {
		expect(getBandForWidth(1024)).toBe('desktop')
		expect(getBandForWidth(1440)).toBe('desktop')
		expect(getBandForWidth(1920)).toBe('desktop')
	})
})
