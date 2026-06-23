import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import { TransferPanel } from './transfer-panel'
import type { TransferSide, TransferTableProps } from './types'
import { useTransferTable } from './use-transfer-table'

// A two-table transfer list: pick rows on the left, move them to the right with
// the buttons or by dragging (multi-select aware). Columns are caller-defined
// per side, so the assigned side can carry extra cells (e.g. action toggles).
// Controlled via assignedIds / onAssignedChange.
export function TransferTable<T>(props: TransferTableProps<T>) {
	const {
		availableColumns,
		assignedColumns,
		labels,
		searchable,
		getRowId,
	} = props
	const pm = useTransferTable(props)
	const [activeId, setActiveId] = useState<string | null>(null)

	// A few px of movement before a drag starts, so clicks on the handle still
	// behave and checkbox clicks never turn into drags.
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	)

	function handleDragStart(event: DragStartEvent) {
		setActiveId(String(event.active.id))
	}

	function handleDragEnd(event: DragEndEvent) {
		setActiveId(null)
		if (!event.over) {
			return
		}
		pm.moveByDrag(String(event.active.id), event.over.id as TransferSide)
	}

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={() => setActiveId(null)}
		>
			<div className='flex flex-col items-stretch gap-3 sm:flex-row'>
				<TransferPanel
					side='available'
					title={labels?.available ?? 'Available'}
					items={pm.visibleAvailable}
					columns={availableColumns}
					getRowId={getRowId}
					isSelected={pm.isSelected}
					toggleRow={pm.toggleRow}
					allState={pm.sideAllState('available')}
					onToggleAll={() => pm.toggleSideAll('available')}
					searchable={searchable}
					query={pm.availableQuery}
					onQueryChange={pm.setAvailableQuery}
					totalCount={pm.availableCount}
				/>

				<div className='flex flex-row justify-center gap-2 sm:flex-col sm:justify-center'>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveSelectedRight}
						disabled={!pm.hasSelectionRight}
						aria-label='Move selected right'
						title='Move selected'
					>
						<ChevronRight />
					</Button>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveAllRight}
						aria-label='Move all right'
						title='Move all'
					>
						<ChevronsRight />
					</Button>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveAllLeft}
						aria-label='Move all left'
						title='Remove all'
					>
						<ChevronsLeft />
					</Button>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveSelectedLeft}
						disabled={!pm.hasSelectionLeft}
						aria-label='Move selected left'
						title='Remove selected'
					>
						<ChevronLeft />
					</Button>
				</div>

				<TransferPanel
					side='assigned'
					title={labels?.assigned ?? 'Assigned'}
					items={pm.visibleAssigned}
					columns={assignedColumns}
					getRowId={getRowId}
					isSelected={pm.isSelected}
					toggleRow={pm.toggleRow}
					allState={pm.sideAllState('assigned')}
					onToggleAll={() => pm.toggleSideAll('assigned')}
					searchable={searchable}
					query={pm.assignedQuery}
					onQueryChange={pm.setAssignedQuery}
					totalCount={pm.assignedCount}
				/>
			</div>

			<DragOverlay>
				{activeId ? (
					<div className='bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm shadow-lg'>
						Move {pm.dragCount(activeId)}
						{pm.dragCount(activeId) > 1 ? ' rows' : ' row'}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
