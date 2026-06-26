import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronsDown,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUp,
	ChevronUp,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useLayoutBand } from '@/hooks/use-layout-band'

import { TransferPanel } from './transfer-panel'
import type { TransferSide, TransferTableProps } from './types'
import { useTransferTablePM } from './use-transfer-table-pm'

// A two-table transfer list: pick rows on the left, move them to the right with
// the buttons or by dragging (multi-select aware). Columns are caller-defined
// per side, so the assigned side can carry extra cells (e.g. action toggles).
// Controlled via assignedIds / onAssignedChange.
//
// The transfer logic lives in useTransferTablePM (dnd-agnostic). This view owns
// only the dnd-kit binding (sensors + event→PM translation) and the band-driven
// responsive layout (button icons flip to up/down when the panels stack).
export function TransferTable<T>(props: TransferTableProps<T>) {
	const { availableColumns, assignedColumns, labels, searchable, getRowId } =
		props
	const pm = useTransferTablePM(props)
	const { t } = useTranslation('common')

	// Below lg the two panels stack (available on top, granted below), so the
	// move buttons point up/down instead of left/right (assigned = down).
	const compact = useLayoutBand() !== 'desktop'
	const ToAssignedIcon = compact ? ChevronDown : ChevronRight
	const AllToAssignedIcon = compact ? ChevronsDown : ChevronsRight
	const AllToAvailableIcon = compact ? ChevronsUp : ChevronsLeft
	const ToAvailableIcon = compact ? ChevronUp : ChevronLeft

	// A few px of movement before a drag starts, so clicks on the handle still
	// behave and checkbox clicks never turn into drags.
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
	)

	function handleDragEnd(event: DragEndEvent) {
		const id = String(event.active.id)
		pm.clearDrag()
		if (event.over) {
			pm.moveByDrag(id, event.over.id as TransferSide)
		}
	}

	return (
		<DndContext
			sensors={sensors}
			onDragStart={(event) => pm.startDrag(String(event.active.id))}
			onDragEnd={handleDragEnd}
			onDragCancel={pm.clearDrag}
		>
			<div className='flex flex-col items-stretch gap-3 lg:flex-row'>
				<TransferPanel
					side='available'
					title={labels?.available ?? t('transfer.available')}
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

				<div className='flex flex-row justify-center gap-2 lg:flex-col lg:justify-center'>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveSelectedRight}
						disabled={!pm.hasSelectionRight}
						aria-label={t('transfer.moveSelected')}
						title={t('transfer.moveSelected')}
					>
						<ToAssignedIcon />
					</Button>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveAllRight}
						aria-label={t('transfer.moveAll')}
						title={t('transfer.moveAll')}
					>
						<AllToAssignedIcon />
					</Button>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveAllLeft}
						aria-label={t('transfer.removeAll')}
						title={t('transfer.removeAll')}
					>
						<AllToAvailableIcon />
					</Button>
					<Button
						type='button'
						variant='outline'
						size='icon'
						onClick={pm.moveSelectedLeft}
						disabled={!pm.hasSelectionLeft}
						aria-label={t('transfer.removeSelected')}
						title={t('transfer.removeSelected')}
					>
						<ToAvailableIcon />
					</Button>
				</div>

				<TransferPanel
					side='assigned'
					title={labels?.assigned ?? t('transfer.assigned')}
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
				{pm.activeId ? (
					<div className='bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm shadow-lg'>
						{t('transfer.dragCount', { count: pm.dragCount })}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	)
}
