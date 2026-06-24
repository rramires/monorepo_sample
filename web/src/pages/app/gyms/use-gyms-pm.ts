import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getNearbyGyms } from '@/api/get-nearby-gyms'
import { searchGyms } from '@/api/search-gyms'
import { usePermissions } from '@/hooks/use-permissions'
import { type Coordinates, getCurrentPosition } from '@/lib/geolocation'

const MIN_QUERY = 3
const PAGE_SIZE = 8

export type GymsStatus =
	| 'locating'
	| 'geo-denied'
	| 'loading'
	| 'empty'
	| 'list'

export function useGymsPM() {
	const { can } = usePermissions()
	// Editing/managing gyms needs the gym.gyms `edit` grant (managers + admins).
	const canManage = can('gym.gyms', 'edit')

	const [coords, setCoords] = useState<Coordinates | null>(null)
	const [geoError, setGeoError] = useState(false)
	const [query, setQuery] = useState('')
	const [page, setPage] = useState(1)
	// Manager-only toggles. Reset the page when either changes (the result set
	// shifts), so we never linger on an out-of-range page.
	const [showDeactivated, _setShowDeactivated] = useState(false)
	// Managers browse the full (non-geo) list by default; ticking "Nearby" opts
	// into the member's geolocation view (to see what a member sees).
	const [nearbyMode, _setNearbyMode] = useState(false)

	const trimmed = query.trim()
	const searching = trimmed.length >= MIN_QUERY

	// Members are always geo; managers are geo only in Nearby mode. The full list
	// (managers, not searching) is served by `search` with an empty query.
	const useGeo = !canManage || nearbyMode
	const usingSearch = searching || (canManage && !nearbyMode)
	// Inactive gyms are a management view — members never see them.
	const includeInactive = canManage && showDeactivated

	// Ask for location only when a geo view is actually used (so the manager's
	// default list view doesn't trigger a needless permission prompt).
	useEffect(() => {
		if (!useGeo) {
			return
		}
		getCurrentPosition()
			.then((position) => setCoords(position))
			.catch(() => setGeoError(true))
	}, [useGeo])

	const nearby = useQuery({
		queryKey: ['gyms', 'nearby', coords, includeInactive],
		queryFn: () => getNearbyGyms(coords!, includeInactive),
		enabled: useGeo && coords !== null && !searching,
	})

	const search = useQuery({
		queryKey: ['gyms', 'search', trimmed, page, includeInactive],
		queryFn: () => searchGyms({ query: trimmed, page, includeInactive }),
		enabled: usingSearch,
	})

	const active = usingSearch ? search : nearby
	// search returns { gyms, total }; nearby returns a plain array (no paging).
	const gyms = usingSearch ? (search.data?.gyms ?? []) : (nearby.data ?? [])
	const total = usingSearch ? (search.data?.total ?? 0) : gyms.length
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

	let status: GymsStatus
	if (active.isLoading) {
		status = 'loading'
	} else if (useGeo && !searching && !coords && !geoError) {
		status = 'locating'
	} else if (useGeo && !searching && geoError) {
		status = 'geo-denied'
	} else if (gyms.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	function handleQueryChange(value: string) {
		setQuery(value)
		setPage(1)
	}

	function setShowDeactivated(value: boolean) {
		_setShowDeactivated(value)
		setPage(1)
	}

	function setNearbyMode(value: boolean) {
		_setNearbyMode(value)
		setPage(1)
	}

	return {
		query,
		page,
		gyms,
		status,
		searching,
		// Creating a gym needs the gym.gyms `create` grant (managers + admins).
		canCreate: can('gym.gyms', 'create'),
		// Manager-only view controls.
		canManage,
		showDeactivated,
		setShowDeactivated,
		nearbyMode,
		setNearbyMode,
		// Pager — only for the search-backed views (search + manager list-all);
		// null in the geo (nearby) view, which isn't paginated.
		pager: usingSearch
			? {
					page,
					total,
					totalPages,
					from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
					to: Math.min(page * PAGE_SIZE, total),
					canPrev: page > 1,
					canNext: page < totalPages,
				}
			: null,
		handleQueryChange,
		firstPage: () => setPage(1),
		lastPage: () => setPage(totalPages),
		nextPage: () => setPage((current) => Math.min(totalPages, current + 1)),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}
