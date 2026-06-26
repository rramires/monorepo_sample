import { Pencil, Plus, Trash2 } from 'lucide-react'
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

import { ModuleDialog } from './module-dialog'
import { useModulesPM } from './use-modules-pm'

type ModuleRow = ReturnType<typeof useModulesPM>['modules'][number]

export function AdminModules() {
	const pm = useModulesPM()
	const { t } = useTranslation(['admin', 'common'])

	const nameWithFlag = (module: ModuleRow) => (
		<>
			{module.name}
			{module.isSystem && (
				<Badge variant='outline'>{t('common:status.system')}</Badge>
			)}
			{!module.isActive && (
				<Badge variant='outline'>{t('common:status.inactive')}</Badge>
			)}
		</>
	)

	const actions = (module: ModuleRow) => (
		<>
			{pm.canEdit && (
				<ModuleDialog
					module={module}
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
			{pm.canDelete && !module.isSystem && (
				<ConfirmDialog
					title={t('modules.delete.title')}
					description={t('modules.delete.description', {
						name: module.name,
					})}
					confirmLabel={t('modules.delete.confirmLabel')}
					onConfirm={() => pm.deleteModule(module.id)}
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

	const columns: ResponsiveListColumn<ModuleRow>[] = [
		{
			key: 'key',
			header: t('modules.columns.key'),
			cell: (module) => module.key,
			className: 'font-mono text-xs',
			card: 'top',
		},
		{
			key: 'name',
			header: t('modules.columns.name'),
			cell: nameWithFlag,
			className: 'space-x-1 font-medium',
			card: 'top',
		},
		{
			key: 'order',
			header: t('modules.columns.order'),
			cell: (module) => module.order,
			card: 'bottom-right',
		},
		{
			key: 'description',
			header: t('modules.columns.description'),
			cell: (module) => module.description,
			className: 'text-muted-foreground',
			card: 'bottom',
		},
		{
			key: 'actions',
			header: t('modules.columns.actions'),
			cell: actions,
			className: 'space-x-2 text-right',
			headClassName: 'text-right',
			card: 'actions',
		},
	]

	return (
		<>
			<PageTitle title={t('modules.pageTitle')} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title={t('modules.title')}
					description={t('modules.description')}
				>
					{pm.canCreate && (
						<ModuleDialog
							trigger={
								<Button size='sm'>
									<Plus />
									{t('modules.new')}
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
								rows={pm.modules}
								columns={columns}
								getRowKey={(module) => String(module.id)}
								empty={
									<p className='text-muted-foreground text-sm'>
										{t('modules.empty')}
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
