import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getUsers } from '@/api/get-users'
import { useLocale } from '@/components/locale/locale-hooks'
import { formatDate } from '@/lib/datetime'

const PAGE_SIZE = 20

export type UsersStatus = 'loading' | 'empty' | 'list'

// View model: the PublicUser shaped for the table (formatted date + a flag), so
// the view stays pure markup.
export interface UserRow {
	id: string
	username: string
	email: string
	role: 'USER' | 'ADMIN'
	verified: boolean
	active: boolean
	created: string
}

export function useUsersPM() {
	const { dateLocale } = useLocale()
	const [page, setPage] = useState(1)

	const { data, isLoading } = useQuery({
		queryKey: ['users', page],
		queryFn: () => getUsers({ page }),
	})

	const users = data?.users ?? []
	const total = data?.total ?? 0
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

	const rows: UserRow[] = users.map((user) => ({
		id: user.id,
		username: user.username,
		email: user.email,
		role: user.role,
		verified: user.is_verified,
		active: user.is_active,
		created: formatDate(user.created_at, dateLocale),
	}))

	let status: UsersStatus
	if (isLoading) {
		status = 'loading'
	} else if (users.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	return {
		rows,
		status,
		page,
		total,
		from: total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1,
		to: Math.min(page * PAGE_SIZE, total),
		hasPrevPage: page > 1,
		hasNextPage: page < totalPages,
		firstPage: () => setPage(1),
		lastPage: () => setPage(totalPages),
		nextPage: () => setPage((current) => Math.min(totalPages, current + 1)),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
	}
}
