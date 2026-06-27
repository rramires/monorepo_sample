import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getProfiles } from '@/api/profiles'
import { getUserProfiles, setUserProfiles } from '@/api/user-profiles'
import { useAuth } from '@/components/auth/auth-hooks'
import { usePermissions } from '@/hooks/use-permissions'
import { messageFromError } from '@/lib/errors'

export function useUserProfilesPM(userId: string) {
	const queryClient = useQueryClient()
	const { t } = useTranslation('admin')
	const { can } = usePermissions()
	const { user } = useAuth()

	const { data: profiles = [] } = useQuery({
		queryKey: ['profiles'],
		queryFn: getProfiles,
	})
	const assignedQuery = useQuery({
		queryKey: ['user-profiles', userId],
		queryFn: () => getUserProfiles(userId),
		enabled: !!userId,
	})

	const [assignedIds, setAssignedIds] = useState<string[]>([])

	useEffect(() => {
		if (assignedQuery.data) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setAssignedIds(assignedQuery.data)
		}
	}, [assignedQuery.data])

	// A disabled profile can't be newly assigned — hide it from the picker, but
	// keep one already assigned to this user so it stays visible (and removable).
	const visibleProfiles = useMemo(
		() => profiles.filter((p) => p.isActive || assignedIds.includes(p.id)),
		[profiles, assignedIds],
	)

	const save = useMutation({
		mutationFn: () => setUserProfiles(userId, assignedIds),
		onSuccess: async () => {
			toast.success(t('users.profiles.toast.updated'))
			await queryClient.invalidateQueries({
				queryKey: ['user-profiles', userId],
			})
			// Editing your own profiles changes your menu/guards.
			if (user?.id === userId) {
				await queryClient.invalidateQueries({
					queryKey: ['me-permissions'],
				})
			}
		},
		onError: (err) => {
			toast.error(messageFromError(err, t('users.profiles.toast.error')))
		},
	})

	return {
		profiles: visibleProfiles,
		assignedIds,
		setAssignedIds,
		isLoading: assignedQuery.isLoading,
		canEdit: can('access-control.users', 'edit'),
		save: () => save.mutate(),
		isSaving: save.isPending,
	}
}
