import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { deleteModule, getModules } from '@/api/modules'
import { usePermissions } from '@/hooks/use-permissions'

export function useModulesPM() {
	const queryClient = useQueryClient()
	const { t } = useTranslation('admin')
	const { can } = usePermissions()

	const { data: modules = [], isLoading } = useQuery({
		queryKey: ['modules'],
		queryFn: getModules,
	})

	const remove = useMutation({
		mutationFn: deleteModule,
		onSuccess: () => {
			toast.success(t('modules.toast.deleted'))
			queryClient.invalidateQueries({ queryKey: ['modules'] })
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					t('modules.toast.deleteError'),
			)
		},
	})

	return {
		modules: [...modules].sort((a, b) => a.order - b.order),
		isLoading,
		canCreate: can('access-control.modules', 'create'),
		canEdit: can('access-control.modules', 'edit'),
		canDelete: can('access-control.modules', 'delete'),
		deleteModule: (id: string) => remove.mutateAsync(id),
	}
}
