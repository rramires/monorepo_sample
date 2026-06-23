import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { deleteProfile, getProfiles } from '@/api/profiles'
import { usePermissions } from '@/hooks/use-permissions'

export function useProfilesPM() {
	const queryClient = useQueryClient()
	const { can } = usePermissions()

	const { data: profiles = [], isLoading } = useQuery({
		queryKey: ['profiles'],
		queryFn: getProfiles,
	})

	const remove = useMutation({
		mutationFn: deleteProfile,
		onSuccess: () => {
			toast.success('Profile deleted.')
			queryClient.invalidateQueries({ queryKey: ['profiles'] })
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not delete the profile.',
			)
		},
	})

	return {
		profiles,
		isLoading,
		canCreate: can('access-control.profiles', 'create'),
		canEdit: can('access-control.profiles', 'edit'),
		canDelete: can('access-control.profiles', 'delete'),
		deleteProfile: (id: string) => remove.mutateAsync(id),
	}
}
