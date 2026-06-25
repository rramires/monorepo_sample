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
import { cn } from '@/lib/utils'

/**
 * Where a column lands in compact-mode (`< lg`) cards:
 * - `top` — header field grid (the default)
 * - `bottom` — footer, left side
 * - `bottom-right` — footer, right side, before the actions
 * - `actions` — footer, far right; rendered without a label
 * - `hide` — omitted from the card (still shown in the desktop table)
 */
export type ResponsiveCardSlot =
	| 'top'
	| 'bottom'
	| 'bottom-right'
	| 'actions'
	| 'hide'

export type ResponsiveListColumn<T> = {
	key: string
	header: React.ReactNode
	cell: (row: T) => React.ReactNode
	/** Extra class on the `<td>`. */
	className?: string
	/** Extra class on the `<th>` (e.g. `text-right` for an actions column). */
	headClassName?: string
	/** Placement in compact-mode cards (default `top`). */
	card?: ResponsiveCardSlot
}

type ResponsiveListProps<T> = {
	rows: T[]
	columns: ResponsiveListColumn<T>[]
	getRowKey: (row: T) => string
	/** Optional custom compact-mode card; defaults to a column-driven card. */
	renderCard?: (row: T) => React.ReactNode
	/** Shown instead of the list when there are no rows. */
	empty?: React.ReactNode
}

function CardField({
	label,
	value,
}: {
	label: React.ReactNode
	value: React.ReactNode
}) {
	return (
		<span className='text-sm'>
			<span className='text-muted-foreground'>{label}: </span>
			<span>{value}</span>
		</span>
	)
}

/** A compact-mode card built from the column definitions + their `card` slot. */
function ResponsiveCard<T>({
	row,
	columns,
}: {
	row: T
	columns: ResponsiveListColumn<T>[]
}) {
	const slotOf = (col: ResponsiveListColumn<T>) => col.card ?? 'top'
	const top = columns.filter((col) => slotOf(col) === 'top')
	const bottom = columns.filter((col) => slotOf(col) === 'bottom')
	const bottomRight = columns.filter((col) => slotOf(col) === 'bottom-right')
	const actions = columns.filter((col) => slotOf(col) === 'actions')
	const hasFooter =
		bottom.length > 0 || bottomRight.length > 0 || actions.length > 0

	return (
		<div className='rounded-md border p-4'>
			{top.length > 0 && (
				<div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
					{top.map((col) => (
						<CardField
							key={col.key}
							label={col.header}
							value={col.cell(row)}
						/>
					))}
				</div>
			)}

			{hasFooter && (
				<div
					className={cn(
						'flex items-center justify-between gap-3',
						top.length > 0 && 'mt-3 border-t border-dashed pt-3',
					)}
				>
					<div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
						{bottom.map((col) => (
							<CardField
								key={col.key}
								label={col.header}
								value={col.cell(row)}
							/>
						))}
					</div>
					<div className='flex shrink-0 items-center gap-3'>
						{bottomRight.map((col) => (
							<CardField
								key={col.key}
								label={col.header}
								value={col.cell(row)}
							/>
						))}
						{actions.map((col) => (
							<div key={col.key} className='flex gap-2'>
								{col.cell(row)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

/**
 * Renders rows as a real `<Table>` on desktop (`≥ lg`) and as a stack of cards
 * on the compact bands (tablet + mobile, `< lg`) — the BackToYou doctrine.
 *
 * It renders exactly one of the two trees (chosen by `useLayoutBand`) rather
 * than both-hidden-via-CSS: this is a client-rendered SPA, so the band resolves
 * synchronously on first paint (no flash) and per-row interactive elements
 * (dialogs, links) mount only once.
 *
 * The compact card is built from the same `columns` (each column's `card` slot
 * decides placement), so a list stays a single source of truth; pass
 * `renderCard` only when a screen needs a bespoke card.
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
					<li key={getRowKey(row)}>
						{renderCard ? (
							renderCard(row)
						) : (
							<ResponsiveCard row={row} columns={columns} />
						)}
					</li>
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
