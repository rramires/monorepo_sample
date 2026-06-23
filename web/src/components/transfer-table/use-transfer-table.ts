import { useMemo, useState } from 'react'

import type { TransferSide, TransferTableProps } from './types'

// Logic for the TransferTable: derives the two lists from the controlled
// assignedIds, owns selection + per-side search, and exposes the move
// operations the buttons and drag-and-drop both call.
export function useTransferTable<T>({
	items,
	getRowId,
	assignedIds,
	onAssignedChange,
	getSearchText,
}: Pick<
	TransferTableProps<T>,
	'items' | 'getRowId' | 'assignedIds' | 'onAssignedChange' | 'getSearchText'
>) {
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [availableQuery, setAvailableQuery] = useState('')
	const [assignedQuery, setAssignedQuery] = useState('')

	const assignedSet = useMemo(() => new Set(assignedIds), [assignedIds])

	// Assigned rows follow assignedIds order; available rows follow items order.
	const assignedItems = useMemo(() => {
		const byId = new Map(items.map((item) => [getRowId(item), item]))
		return assignedIds
			.map((id) => byId.get(id))
			.filter((item): item is T => item !== undefined)
	}, [items, assignedIds, getRowId])

	const availableItems = useMemo(
		() => items.filter((item) => !assignedSet.has(getRowId(item))),
		[items, assignedSet, getRowId],
	)

	function filterBy(list: T[], query: string) {
		const q = query.trim().toLowerCase()
		if (!q || !getSearchText) {
			return list
		}
		return list.filter((item) =>
			getSearchText(item).toLowerCase().includes(q),
		)
	}

	const visibleAvailable = useMemo(
		() => filterBy(availableItems, availableQuery),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[availableItems, availableQuery],
	)
	const visibleAssigned = useMemo(
		() => filterBy(assignedItems, assignedQuery),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[assignedItems, assignedQuery],
	)

	function clearFromSelection(ids: string[]) {
		setSelected((prev) => {
			const next = new Set(prev)
			ids.forEach((id) => next.delete(id))
			return next
		})
	}

	// ── Move operations ──────────────────────────────────────────────────────
	function assignIds(ids: string[]) {
		const fresh = ids.filter((id) => !assignedSet.has(id))
		if (fresh.length === 0) {
			return
		}
		onAssignedChange([...assignedIds, ...fresh])
		clearFromSelection(fresh)
	}

	function unassignIds(ids: string[]) {
		const drop = new Set(ids)
		if (drop.size === 0) {
			return
		}
		onAssignedChange(assignedIds.filter((id) => !drop.has(id)))
		clearFromSelection(ids)
	}

	const availableIds = () => visibleAvailable.map(getRowId)
	const assignedIdsVisible = () => visibleAssigned.map(getRowId)

	function selectedOn(side: TransferSide) {
		const ids = side === 'available' ? availableIds() : assignedIdsVisible()
		return ids.filter((id) => selected.has(id))
	}

	const moveSelectedRight = () => assignIds(selectedOn('available'))
	const moveSelectedLeft = () => unassignIds(selectedOn('assigned'))
	const moveAllRight = () => assignIds(availableIds())
	const moveAllLeft = () => unassignIds(assignedIdsVisible())

	// Drag-and-drop: dropping onto a side moves the dragged row there — together
	// with the rest of the current selection on its source side, if it was part
	// of a multi-selection.
	function moveByDrag(activeId: string, targetSide: TransferSide) {
		const sourceSide: TransferSide = assignedSet.has(activeId)
			? 'assigned'
			: 'available'
		if (sourceSide === targetSide) {
			return
		}
		const group = selected.has(activeId)
			? [...new Set([activeId, ...selectedOn(sourceSide)])]
			: [activeId]
		if (targetSide === 'assigned') {
			assignIds(group)
		} else {
			unassignIds(group)
		}
	}

	// How many rows a drag of `activeId` would carry (the selection group, or
	// just the dragged row). Drives the drag overlay's count.
	function dragCount(activeId: string) {
		if (!selected.has(activeId)) {
			return 1
		}
		const side: TransferSide = assignedSet.has(activeId)
			? 'assigned'
			: 'available'
		return new Set([activeId, ...selectedOn(side)]).size
	}

	// ── Selection ──────────────────────────────────────────────────────────
	function toggleRow(id: string) {
		setSelected((prev) => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				next.add(id)
			}
			return next
		})
	}

	function sideAllState(side: TransferSide): boolean | 'indeterminate' {
		const ids = side === 'available' ? availableIds() : assignedIdsVisible()
		if (ids.length === 0) {
			return false
		}
		const count = ids.filter((id) => selected.has(id)).length
		if (count === 0) {
			return false
		}
		return count === ids.length ? true : 'indeterminate'
	}

	function toggleSideAll(side: TransferSide) {
		const ids = side === 'available' ? availableIds() : assignedIdsVisible()
		const allSelected = ids.every((id) => selected.has(id))
		setSelected((prev) => {
			const next = new Set(prev)
			if (allSelected) {
				ids.forEach((id) => next.delete(id))
			} else {
				ids.forEach((id) => next.add(id))
			}
			return next
		})
	}

	return {
		visibleAvailable,
		visibleAssigned,
		availableCount: availableItems.length,
		assignedCount: assignedItems.length,
		availableQuery,
		assignedQuery,
		setAvailableQuery,
		setAssignedQuery,
		isSelected: (id: string) => selected.has(id),
		toggleRow,
		sideAllState,
		toggleSideAll,
		hasSelectionRight: selectedOn('available').length > 0,
		hasSelectionLeft: selectedOn('assigned').length > 0,
		moveSelectedRight,
		moveSelectedLeft,
		moveAllRight,
		moveAllLeft,
		moveByDrag,
		dragCount,
		getRowId,
	}
}
