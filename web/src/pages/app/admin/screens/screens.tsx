import { ClipboardPen, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { PermissionsEditor } from './permissions-editor/permissions-editor'
import { ScreenDialog } from './screen-dialog'
import { useScreensPM } from './use-screens-pm'

type ScreenRow = ReturnType<typeof useScreensPM>['rows'][number]

export function AdminScreens() {
	const pm = useScreensPM()
	const { t } = useTranslation(['admin', 'common'])

	const nameWithFlag = (screen: ScreenRow) => (
		<>
			{screen.name}
			{screen.isSystem && (
				<Badge variant='outline'>{t('common:status.system')}</Badge>
			)}
			{!screen.isActive && (
				<Badge variant='outline'>{t('common:status.inactive')}</Badge>
			)}
			{/* Killed by the emergency switch (Screen.is_enabled = off). */}
			{!screen.isEnabled && (
				<Badge variant='destructive'>{t('common:status.off')}</Badge>
			)}
		</>
	)

	const actions = (screen: ScreenRow) => (
		<>
			{pm.canEdit && (
				<PermissionsEditor
					screen={screen}
					trigger={
						<Button
							variant='outline'
							size='sm'
							className='w-16 lg:w-auto'
							aria-label={t('screens.editPermissionsAria', {
								name: screen.name,
							})}
						>
							<ClipboardPen />
						</Button>
					}
				/>
			)}
			{pm.canEdit && (
				<ScreenDialog
					screen={screen}
					modules={pm.modules}
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
			{pm.canDelete && !screen.isSystem && (
				<ConfirmDialog
					title={t('screens.delete.title')}
					description={t('screens.delete.description', {
						name: screen.name,
					})}
					confirmLabel={t('screens.delete.confirmLabel')}
					onConfirm={() => pm.deleteScreen(screen.id)}
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

	const columns: ResponsiveListColumn<ScreenRow>[] = [
		{
			key: 'module',
			header: t('screens.columns.module'),
			cell: (screen) => pm.moduleName(screen.moduleId),
			card: 'bottom',
		},
		{
			key: 'key',
			header: t('screens.columns.key'),
			cell: (screen) => screen.key,
			className: 'font-mono text-xs',
			card: 'top',
		},
		{
			key: 'name',
			header: t('screens.columns.name'),
			cell: nameWithFlag,
			className: 'space-x-1 font-medium',
			card: 'top',
		},
		{
			key: 'path',
			header: t('screens.columns.path'),
			cell: (screen) => screen.path,
			className: 'text-muted-foreground font-mono text-xs',
			card: 'top',
		},
		{
			key: 'actions',
			header: t('screens.columns.actions'),
			cell: actions,
			className: 'space-x-2 text-right',
			headClassName: 'text-right',
			card: 'actions',
		},
	]

	return (
		<>
			<PageTitle title={t('screens.pageTitle')} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title={t('screens.title')}
					description={t('screens.description')}
				>
					{pm.canCreate && (
						<ScreenDialog
							modules={pm.modules}
							trigger={
								<Button size='sm'>
									<Plus />
									{t('screens.new')}
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
								rows={pm.rows}
								columns={columns}
								getRowKey={(screen) => String(screen.id)}
								empty={
									<p className='text-muted-foreground text-sm'>
										{t('screens.empty')}
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
