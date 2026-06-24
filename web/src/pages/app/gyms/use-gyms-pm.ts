import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { getNearbyGyms } from '@/api/get-nearby-gyms'
import { searchGyms } from '@/api/search-gyms'
import { usePermissions } from '@/hooks/use-permissions'
import { type Coordinates, getCurrentPosition } from '@/lib/geolocation'

const MIN_QUERY = 3
const PAGE_SIZE = 20

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
	const [showDeactivated, setShowDeactivated] = useState(false)

	// On mount: ask for the user's location. Granted → show nearby gyms;
	// denied/unavailable → fall back to search-by-name only.
	useEffect(() => {
		getCurrentPosition()
			.then((position) => setCoords(position))
			.catch(() => setGeoError(true))
	}, [])

	const trimmed = query.trim()
	const searching = trimmed.length >= MIN_QUERY
	// Managers can opt into inactive gyms via the "Show deactivated" toggle; it
	// only applies to search (nearby is the member browse — always active-only).
	const includeInactive = canManage && showDeactivated

	const nearby = useQuery({
		queryKey: ['gyms', 'nearby', coords],
		queryFn: () => getNearbyGyms(coords!),
		enabled: coords !== null && !searching,
	})

	const search = useQuery({
		queryKey: ['gyms', 'search', trimmed, page, includeInactive],
		queryFn: () => searchGyms({ query: trimmed, page, includeInactive }),
		enabled: searching,
	})

	const active = searching ? search : nearby
	const gyms = active.data ?? []

	let status: GymsStatus
	if (active.isLoading) {
		status = 'loading'
	} else if (!coords && !geoError && !searching) {
		status = 'locating'
	} else if (geoError && !searching) {
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

	return {
		query,
		page,
		gyms,
		status,
		searching,
		// Creating a gym needs the gym.gyms `create` grant (managers + admins).
		canCreate: can('gym.gyms', 'create'),
		// Managers may reveal deactivated gyms in search results.
		canManage,
		showDeactivated,
		setShowDeactivated,
		hasPrevPage: searching && page > 1,
		hasNextPage: searching && gyms.length === PAGE_SIZE,
		handleQueryChange,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}
