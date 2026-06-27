import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { NoticeDialog } from './notice-dialog'
import { useNoticesPM } from './use-notices-pm'

type NoticeRow = ReturnType<typeof useNoticesPM>['notices'][number]

export function Notices() {
	const pm = useNoticesPM()
	const { t } = useTranslation(['notices', 'common'])

	const actions = (notice: NoticeRow) => (
		<>
			{pm.canEdit && (
				<NoticeDialog
					notice={{
						id: notice.id,
						title: notice.title,
						category: notice.category,
					}}
					trigger={
						<Button
							variant='outline'
							size='sm'
							className='w-16 lg:w-auto'
						>
							<Pencil />
						</Button>
					}
				/>
			)}
			{pm.canDelete && (
				<ConfirmDialog
					title={t('delete.title')}
					// nota: a chave de interpolação aqui é {{title}} (não {{name}})
					description={t('delete.description', {
						title: notice.title,
					})}
					confirmLabel={t('delete.confirmLabel')}
					onConfirm={() => pm.deleteNotice(notice.id)}
					trigger={
						<Button
							variant='outline'
							size='sm'
							className='w-16 lg:w-auto'
						>
							<Trash2 />
						</Button>
					}
				/>
			)}
		</>
	)

	const columns: ResponsiveListColumn<NoticeRow>[] = [
		{
			key: 'title',
			header: t('columns.title'),
			cell: (n) => n.title,
			className: 'font-medium',
			card: 'top',
		},
		{
			key: 'category',
			header: t('columns.category'),
			cell: (n) => n.categoryLabel,
			card: 'bottom-right',
		},
		{
			key: 'created',
			header: t('columns.created'),
			cell: (n) => n.created,
			className: 'text-muted-foreground',
			card: 'bottom',
		},
		{
			key: 'actions',
			header: t('columns.actions'),
			cell: actions,
			className: 'space-x-2 text-right',
			headClassName: 'text-right',
			card: 'actions',
		},
	]

	return (
		<>
			<PageTitle title={t('pageTitle')} />
			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader title={t('title')} description={t('description')}>
					{pm.canCreate && (
						<NoticeDialog
							trigger={
								<Button size='sm'>
									<Plus />
									{t('new')}
								</Button>
							}
						/>
					)}
				</PageHeader>
				<Card>
					<CardContent>
						{pm.isLoading ? (
							<p className='text-muted-foreground text-sm'>
								{t('common:states.loading')}
							</p>
						) : (
							<ResponsiveList
								rows={pm.notices}
								columns={columns}
								getRowKey={(n) => String(n.id)}
								empty={
									<p className='text-muted-foreground text-sm'>
										{t('empty')}
									</p>
								}
							/>
						)}
					</CardContent>
				</Card>
			</div>
		</>
	)
}
