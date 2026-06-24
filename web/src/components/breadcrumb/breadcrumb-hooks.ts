import { useContext, useEffect } from 'react'

import { BreadcrumbContext } from './breadcrumb-context'

// Read the breadcrumb context — the breadcrumbs renderer uses this for the
// dynamic leaf label.
export function useBreadcrumb() {
	return useContext(BreadcrumbContext)
}

// Publish a dynamic leaf label from a detail page (e.g. the loaded entity's
// name). Re-publishes when the label changes and clears on unmount, so leaving
// the page doesn't leak a stale crumb onto the next route.
export function useSetBreadcrumb(label: string | null | undefined) {
	const { setLabel } = useBreadcrumb()

	useEffect(() => {
		setLabel(label ?? null)
		return () => setLabel(null)
	}, [label, setLabel])
}
