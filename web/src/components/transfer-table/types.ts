import type { ReactNode } from 'react'

// A column definition for one side of the TransferTable. Generic over the row
// type, so callers customize what each side shows — the assigned side, for
// instance, can render action toggles bound to the caller's own state.
export interface TransferColumn<T> {
	key: string
	header: ReactNode
	cell: (item: T) => ReactNode
	/** Extra classes for both the header and the body cells of this column. */
	className?: string
}

export type TransferSide = 'available' | 'assigned'

export interface TransferTableProps<T> {
	/** The full universe of rows (assigned + available combined). */
	items: T[]
	/** Stable id for a row. */
	getRowId: (item: T) => string
	/** Controlled list of assigned ids (order is preserved on the right). */
	assignedIds: string[]
	onAssignedChange: (ids: string[]) => void
	availableColumns: TransferColumn<T>[]
	assignedColumns: TransferColumn<T>[]
	labels?: { available?: string; assigned?: string }
	/** Show a per-side search box filtering on getSearchText. */
	searchable?: boolean
	getSearchText?: (item: T) => string
}
