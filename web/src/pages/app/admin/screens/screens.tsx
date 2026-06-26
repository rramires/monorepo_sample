import { ClipboardPen, Pencil, Plus, Trash2 } from 'lucide-react'

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

function nameWithFlag(screen: ScreenRow) {
	return (
		<>
			{screen.name}
			{screen.isSystem && <Badge variant='outline'>System</Badge>}
			{!screen.isActive && <Badge variant='outline'>Inactive</Badge>}
			{/* Killed by the emergency switch (Screen.is_enabled = off). */}
			{!screen.isEnabled && <Badge variant='destructive'>Off</Badge>}
		</>
	)
}

export function AdminScreens() {
	const pm = useScreensPM()

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
							aria-label={`Edit ${screen.name} permissions`}
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
					title='Delete screen'
					description={`Delete "${screen.name}"? Only screens not assigned to any profile can be deleted.`}
					confirmLabel='Delete'
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
			header: 'Module',
			cell: (screen) => pm.moduleName(screen.moduleId),
			card: 'bottom',
		},
		{
			key: 'key',
			header: 'Key',
			cell: (screen) => screen.key,
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
			key: 'path',
			header: 'Path',
			cell: (screen) => screen.path,
			className: 'text-muted-foreground font-mono text-xs',
			card: 'top',
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

				<Card>
					<CardContent>
						{pm.isLoading ? (
							<p className='text-muted-foreground text-sm'>
								Loading…
							</p>
						) : (
							<ResponsiveList
								rows={pm.rows}
								columns={columns}
								getRowKey={(screen) => String(screen.id)}
								empty={
									<p className='text-muted-foreground text-sm'>
										No screens found.
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
