import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { ModuleDialog } from './module-dialog'
import { useModulesPM } from './use-modules-pm'

type ModuleRow = ReturnType<typeof useModulesPM>['modules'][number]

function nameWithFlag(module: ModuleRow) {
	return (
		<>
			{module.name}
			{module.isSystem && <Badge variant='outline'>System</Badge>}
		</>
	)
}

export function AdminModules() {
	const pm = useModulesPM()

	const actions = (module: ModuleRow) => (
		<>
			{pm.canEdit && (
				<ModuleDialog
					module={module}
					trigger={
						<Button variant='outline' size='sm'>
							<Pencil />
						</Button>
					}
				/>
			)}
			{pm.canDelete && !module.isSystem && (
				<ConfirmDialog
					title='Delete module'
					description={`Delete "${module.name}"? Screens must be removed first.`}
					confirmLabel='Delete'
					onConfirm={() => pm.deleteModule(module.id)}
					trigger={
						<Button variant='outline' size='sm'>
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
			header: 'Key',
			cell: (module) => module.key,
			className: 'font-mono text-xs',
			card: 'top',
		},
		{
			key: 'name',
			header: 'Name',
			cell: nameWithFlag,
			className: 'space-x-1 font-medium',
			card: 'top',
		},
		{
			key: 'order',
			header: 'Order',
			cell: (module) => module.order,
			card: 'bottom-right',
		},
		{
			key: 'description',
			header: 'Description',
			cell: (module) => module.description,
			className: 'text-muted-foreground',
			card: 'bottom',
		},
		{
			key: 'actions',
			header: 'Actions',
			cell: actions,
			className: 'space-x-2 text-right',
			headClassName: 'text-right',
			card: 'actions',
		},
	]

	return (
		<>
			<PageTitle title='Manage Modules' />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title='Modules'
					description='Modules group related screens.'
				>
					{pm.canCreate && (
						<ModuleDialog
							trigger={
								<Button size='sm'>
									<Plus />
									New module
								</Button>
							}
						/>
					)}
				</PageHeader>

				{pm.isLoading ? (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				) : (
					<ResponsiveList
						rows={pm.modules}
						columns={columns}
						getRowKey={(module) => String(module.id)}
						empty={
							<p className='text-muted-foreground text-sm'>
								No modules found.
							</p>
						}
					/>
				)}
			</div>
		</>
	)
}
