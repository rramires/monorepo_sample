import { type ReactNode, useMemo, useState } from 'react'

import { BreadcrumbContext } from './breadcrumb-context'

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
	const [label, setLabel] = useState<string | null>(null)
	const value = useMemo(() => ({ label, setLabel }), [label])

	return (
		<BreadcrumbContext.Provider value={value}>
			{children}
		</BreadcrumbContext.Provider>
	)
}
