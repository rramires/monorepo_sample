import { createContext } from 'react'

export interface BreadcrumbContextValue {
	// Dynamic leaf label published by a detail page (the entity's name); null
	// until a page sets it. Static crumbs are derived from the route, so only the
	// dynamic leaf needs to live in context.
	label: string | null
	setLabel: (label: string | null) => void
}

export const BreadcrumbContext = createContext<BreadcrumbContextValue>({
	label: null,
	setLabel: () => {},
})
