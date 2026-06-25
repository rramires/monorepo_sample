import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'

import { getCheckInsHistory } from '@/api/get-check-ins-history'
import { validateCheckIn } from '@/api/validate-check-in'
import { usePermissions } from '@/hooks/use-permissions'

const PAGE_SIZE = 20

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
})

export type CheckInsStatus = 'loading' | 'empty' | 'list'

// View model: the raw CheckIn shaped for display (formatted date + a flag),
// so the view stays pure markup.
export interface CheckInItem {
	id: string
	date: string
	validated: boolean
}

export function useCheckInsPM() {
	const { can } = usePermissions()
	const queryClient = useQueryClient()
	const [page, setPage] = useState(1)

	const { data: checkIns = [], isLoading } = useQuery({
		queryKey: ['check-ins', 'history', page],
		queryFn: () => getCheckInsHistory({ page }),
	})

	const validate = useMutation({
		mutationFn: validateCheckIn,
		onSuccess: () => {
			toast.success('Check-in validated.')
			queryClient.invalidateQueries({ queryKey: ['check-ins'] })
		},
		onError: (err) => {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not validate the check-in.'
			toast.error(message)
		},
	})

	const items: CheckInItem[] = checkIns.map((checkIn) => ({
		id: checkIn.id,
		date: dateFormatter.format(new Date(checkIn.created_at)),
		validated: checkIn.validated_at !== null,
	}))

	let status: CheckInsStatus
	if (isLoading) {
		status = 'loading'
	} else if (checkIns.length === 0) {
		status = 'empty'
	} else {
		status = 'list'
	}

	return {
		items,
		status,
		page,
		hasPrevPage: page > 1,
		hasNextPage: checkIns.length === PAGE_SIZE,
		nextPage: () => setPage((current) => current + 1),
		prevPage: () => setPage((current) => Math.max(1, current - 1)),
		// Validating is an extra op of the Check-ins screen (composed key), so the
		// grant is gym.check-ins.edit_validate; members never see the button
		// (managers and admins do).
		canValidate: can('gym.check-ins', 'edit_validate'),
		validateCheckIn: (id: string) => validate.mutate(id),
		validatingId: validate.isPending ? validate.variables : null,
	}
}
