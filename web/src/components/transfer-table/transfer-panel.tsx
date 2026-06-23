import { useDraggable, useDroppable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import type { TransferColumn, TransferSide } from './types'

interface TransferPanelProps<T> {
	side: TransferSide
	title: string
	items: T[]
	columns: TransferColumn<T>[]
	getRowId: (item: T) => string
	isSelected: (id: string) => boolean
	toggleRow: (id: string) => void
	allState: boolean | 'indeterminate'
	onToggleAll: () => void
	searchable?: boolean
	query: string
	onQueryChange: (value: string) => void
	totalCount: number
}

function DraggableRow<T>({
	id,
	side,
	selected,
	onToggle,
	columns,
	item,
}: {
	id: string
	side: TransferSide
	selected: boolean
	onToggle: () => void
	columns: TransferColumn<T>[]
	item: T
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id,
		data: { side },
	})

	return (
		<TableRow
			data-state={selected ? 'selected' : undefined}
			className={cn(isDragging && 'opacity-40')}
		>
			<TableCell className='w-8 px-1'>
				{/* Drag handle only — keeps row checkboxes/toggles clickable. */}
				<button
					type='button'
					ref={setNodeRef}
					className='text-muted-foreground hover:text-foreground flex cursor-grab touch-none items-center active:cursor-grabbing'
					aria-label='Drag row'
					{...attributes}
					{...listeners}
				>
					<GripVertical className='size-4' />
				</button>
			</TableCell>
			<TableCell className='w-8 px-1'>
				<Checkbox
					checked={selected}
					onCheckedChange={onToggle}
					aria-label='Select row'
				/>
			</TableCell>
			{columns.map((column) => (
				<TableCell key={column.key} className={column.className}>
					{column.cell(item)}
				</TableCell>
			))}
		</TableRow>
	)
}

export function TransferPanel<T>({
	side,
	title,
	items,
	columns,
	getRowId,
	isSelected,
	toggleRow,
	allState,
	onToggleAll,
	searchable,
	query,
	onQueryChange,
	totalCount,
}: TransferPanelProps<T>) {
	const { setNodeRef, isOver } = useDroppable({ id: side })

	return (
		<div className='flex min-w-0 flex-1 flex-col gap-2'>
			<div className='flex items-center justify-between'>
				<span className='text-sm font-medium'>{title}</span>
				<span className='text-muted-foreground text-xs'>
					{items.length}
					{items.length !== totalCount ? ` / ${totalCount}` : ''}
				</span>
			</div>

			{searchable && (
				<Input
					value={query}
					onChange={(event) => onQueryChange(event.target.value)}
					placeholder='Search…'
					className='h-8'
				/>
			)}

			<div
				ref={setNodeRef}
				className={cn(
					'min-h-32 flex-1 overflow-auto rounded-md border transition-colors',
					isOver && 'border-primary bg-primary/5',
				)}
			>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className='w-8 px-1' />
							<TableHead className='w-8 px-1'>
								<Checkbox
									checked={allState}
									onCheckedChange={onToggleAll}
									aria-label='Select all'
								/>
							</TableHead>
							{columns.map((column) => (
								<TableHead
									key={column.key}
									className={column.className}
								>
									{column.header}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length + 2}
									className='text-muted-foreground h-24 text-center text-sm'
								>
									Nothing here.
								</TableCell>
							</TableRow>
						) : (
							items.map((item) => {
								const id = getRowId(item)
								return (
									<DraggableRow
										key={id}
										id={id}
										side={side}
										item={item}
										columns={columns}
										selected={isSelected(id)}
										onToggle={() => toggleRow(id)}
									/>
								)
							})
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
