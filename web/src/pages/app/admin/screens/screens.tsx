import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { DataCard } from '@/components/responsive-list/data-card'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { ScreenDialog } from './screen-dialog'
import { useScreensPM } from './use-screens-pm'

type ScreenRow = ReturnType<typeof useScreensPM>['rows'][number]

function nameWithFlag(screen: ScreenRow) {
	return (
		<>
			{screen.name}
			{screen.isSystem && <Badge variant='outline'>System</Badge>}
		</>
	)
}

export function AdminScreens() {
	const pm = useScreensPM()

	const actions = (screen: ScreenRow) => (
		<>
			{pm.canEdit && (
				<ScreenDialog
					screen={screen}
					modules={pm.modules}
					trigger={
						<Button variant='outline' size='sm'>
							<Pencil />
						</Button>
					}
				/>
			)}
			{pm.canDelete && !screen.isSystem && (
				<ConfirmDialog
					title='Delete screen'
					description={`Delete "${screen.name}"? Its grants are removed too.`}
					confirmLabel='Delete'
					onConfirm={() => pm.deleteScreen(screen.id)}
					trigger={
						<Button variant='outline' size='sm'>
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
			header: 'Module',
			cell: (screen) => pm.moduleName(screen.moduleId),
		},
		{
			key: 'key',
			header: 'Key',
			cell: (screen) => screen.key,
			className: 'font-mono text-xs',
		},
		{
			key: 'name',
			header: 'Name',
			cell: nameWithFlag,
			className: 'space-x-1 font-medium',
		},
		{
			key: 'path',
			header: 'Path',
			cell: (screen) => screen.path,
			className: 'text-muted-foreground font-mono text-xs',
		},
		{
			key: 'actions',
			header: 'Actions',
			cell: actions,
			className: 'space-x-2 text-right',
			headClassName: 'text-right',
		},
	]

	const renderCard = (screen: ScreenRow) => (
		<DataCard
			primary={nameWithFlag(screen)}
			secondary={<span className='font-mono'>{screen.path}</span>}
			footer={
				<>
					<span className='text-muted-foreground text-sm'>
						{pm.moduleName(screen.moduleId)}
					</span>
					<div className='flex gap-2'>{actions(screen)}</div>
				</>
			}
		/>
	)

	return (
		<>
			<PageTitle title='Manage Screens' />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title='Screens'
					description='Screens are what access grants attach to.'
				>
					{pm.canCreate && (
						<ScreenDialog
							modules={pm.modules}
							trigger={
								<Button size='sm'>
									<Plus />
									New screen
								</Button>
							}
						/>
					)}
				</PageHeader>

				{pm.isLoading ? (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				) : (
					<ResponsiveList
						rows={pm.rows}
						columns={columns}
						getRowKey={(screen) => String(screen.id)}
						renderCard={renderCard}
						empty={
							<p className='text-muted-foreground text-sm'>
								No screens found.
							</p>
						}
					/>
				)}
			</div>
		</>
	)
}
