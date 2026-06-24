import * as React from 'react'

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { useLayoutBand } from '@/hooks/use-layout-band'

export type ResponsiveListColumn<T> = {
	key: string
	header: React.ReactNode
	cell: (row: T) => React.ReactNode
	/** Extra class on the `<td>`. */
	className?: string
	/** Extra class on the `<th>` (e.g. `text-right` for an actions column). */
	headClassName?: string
}

type ResponsiveListProps<T> = {
	rows: T[]
	columns: ResponsiveListColumn<T>[]
	getRowKey: (row: T) => string
	/** Compact-mode (`< lg`) card for one row — use the `DataCard` recipe. */
	renderCard: (row: T) => React.ReactNode
	/** Shown instead of the list when there are no rows. */
	empty?: React.ReactNode
}

/**
 * Renders rows as a real `<Table>` on desktop (`≥ lg`) and as a stack of cards
 * on the compact bands (tablet + mobile, `< lg`) — the BackToYou doctrine.
 *
 * It renders exactly one of the two trees (chosen by `useLayoutBand`) rather
 * than both-hidden-via-CSS: this is a client-rendered SPA, so the band resolves
 * synchronously on first paint (no flash) and per-row interactive elements
 * (dialogs, links) mount only once.
 */
export function ResponsiveList<T>({
	rows,
	columns,
	getRowKey,
	renderCard,
	empty,
}: ResponsiveListProps<T>) {
	const compact = useLayoutBand() !== 'desktop'

	if (rows.length === 0 && empty) {
		return <>{empty}</>
	}

	if (compact) {
		return (
			<ul className='grid gap-2'>
				{rows.map((row) => (
					<li key={getRowKey(row)}>{renderCard(row)}</li>
				))}
			</ul>
		)
	}

	return (
		<div className='rounded-md border'>
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((col) => (
							<TableHead
								key={col.key}
								className={col.headClassName}
							>
								{col.header}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={getRowKey(row)}>
							{columns.map((col) => (
								<TableCell
									key={col.key}
									className={col.className}
								>
									{col.cell(row)}
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
