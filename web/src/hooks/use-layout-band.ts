import * as React from 'react'

export type LayoutBand = 'mobile' | 'tablet' | 'desktop'

// Tailwind default breakpoints: md = 768, lg = 1024.
const TABLET_MIN = 768
const DESKTOP_MIN = 1024

/**
 * Pure band classifier — unit-tested without matchMedia.
 * mobile `< md` (768) · tablet `md–lg` (768–1023) · desktop `≥ lg` (1024).
 */
export function getBandForWidth(width: number): LayoutBand {
	if (width < TABLET_MIN) {
		return 'mobile'
	}
	if (width < DESKTOP_MIN) {
		return 'tablet'
	}
	return 'desktop'
}

function subscribe(callback: () => void) {
	const queries = [
		window.matchMedia(`(min-width: ${TABLET_MIN}px)`),
		window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`),
	]
	queries.forEach((mql) => mql.addEventListener('change', callback))
	return () =>
		queries.forEach((mql) => mql.removeEventListener('change', callback))
}

export function useLayoutBand(): LayoutBand {
	// useSyncExternalStore mirrors use-mobile: read the viewport without a
	// setState-in-effect, which keeps our react-hooks lint rule happy.
	return React.useSyncExternalStore(
		subscribe,
		() => getBandForWidth(window.innerWidth),
		() => 'desktop',
	)
}
