import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { deleteNotice, listNotices } from '@/api/notices'
import { useLocale } from '@/components/locale/locale-hooks'
import { usePermissions } from '@/hooks/use-permissions'
import { formatDate } from '@/lib/datetime'
import { messageFromError } from '@/lib/errors'

export function useNoticesPM() {
	const queryClient = useQueryClient()
	const { t } = useTranslation('notices')
	const { dateLocale } = useLocale()
	const { can } = usePermissions()

	const { data: notices = [], isLoading } = useQuery({
		queryKey: ['notices'],
		queryFn: listNotices,
	})

	const remove = useMutation({
		mutationFn: deleteNotice,
		onSuccess: () => {
			toast.success(t('toast.deleted'))
			queryClient.invalidateQueries({ queryKey: ['notices'] })
		},
		onError: (err) =>
			toast.error(messageFromError(err, t('toast.deleteError'))),
	})

	const rows = [...notices]
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
		.map((n) => ({
			id: n.id,
			title: n.title,
			category: n.category,
			categoryLabel: t(`categories.${n.category}`),
			created: formatDate(n.createdAt, dateLocale),
		}))

	return {
		notices: rows,
		isLoading,
		canCreate: can('notices.notices', 'create'),
		canEdit: can('notices.notices', 'edit'),
		canDelete: can('notices.notices', 'delete'),
		deleteNotice: (id: string) => remove.mutateAsync(id),
	}
}
