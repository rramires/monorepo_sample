import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { getModules } from '@/api/modules'
import { deleteScreen, getScreens } from '@/api/screens'
import { usePermissions } from '@/hooks/use-permissions'

export function useScreensPM() {
	const queryClient = useQueryClient()
	const { can } = usePermissions()

	const { data: screens = [], isLoading } = useQuery({
		queryKey: ['screens'],
		queryFn: () => getScreens(),
	})
	const { data: modules = [] } = useQuery({
		queryKey: ['modules'],
		queryFn: getModules,
	})

	const moduleName = useMemo(() => {
		const map = new Map(modules.map((m) => [m.id, m.name]))
		return (id: string) => map.get(id) ?? id
	}, [modules])

	const remove = useMutation({
		mutationFn: deleteScreen,
		onSuccess: () => {
			toast.success('Screen deleted.')
			queryClient.invalidateQueries({ queryKey: ['screens'] })
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not delete the screen.',
			)
		},
	})

	// Group by module order, then screen order.
	const rows = useMemo(() => {
		const moduleOrder = new Map(modules.map((m) => [m.id, m.order]))
		return [...screens].sort((a, b) => {
			const mo =
				(moduleOrder.get(a.moduleId) ?? 0) -
				(moduleOrder.get(b.moduleId) ?? 0)
			return mo !== 0 ? mo : a.order - b.order
		})
	}, [screens, modules])

	return {
		rows,
		modules,
		moduleName,
		isLoading,
		canCreate: can('access-control.screens', 'create'),
		canEdit: can('access-control.screens', 'edit'),
		canDelete: can('access-control.screens', 'delete'),
		deleteScreen: (id: string) => remove.mutateAsync(id),
	}
}
