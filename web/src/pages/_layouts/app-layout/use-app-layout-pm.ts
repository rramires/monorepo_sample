import * as React from 'react'

import { type LayoutBand, useLayoutBand } from '@/hooks/use-layout-band'

// Tablet opens as an icon rail; mobile/desktop default to an open sidebar
// (mobile's persistent open state is moot — it uses the Sheet drawer).
function bandDefaultOpen(band: LayoutBand) {
	return band !== 'tablet'
}

export function useAppLayoutPM() {
	// Band-driven sidebar default. A manual toggle is stored as an override
	// tagged with the band it was made in: it sticks while you stay in that band
	// and is automatically dropped (re-snapping to the band default) the moment
	// the viewport crosses a breakpoint — no effect / render-phase setState.
	const band = useLayoutBand()
	const [override, setOverride] = React.useState<{
		band: LayoutBand
		open: boolean
	} | null>(null)

	const sidebarOpen =
		override && override.band === band
			? override.open
			: bandDefaultOpen(band)

	const onOpenChange = React.useCallback(
		(open: boolean) => setOverride({ band, open }),
		[band],
	)

	return { sidebarOpen, onOpenChange }
}
