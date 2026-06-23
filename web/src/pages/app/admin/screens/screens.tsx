import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'

import { ScreenDialog } from './screen-dialog'
import { useScreensPM } from './use-screens-pm'

export function AdminScreens() {
	const pm = useScreensPM()

	return (
		<>
			<PageTitle title='Manage Screens' />

			<div className='flex flex-1 flex-col gap-4 p-8'>
				<div className='flex items-start justify-between gap-4'>
					<div>
						<h1 className='text-2xl font-bold'>Screens</h1>
						<p className='text-muted-foreground text-sm'>
							Screens are what access grants attach to.
						</p>
					</div>
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
				</div>

				{pm.isLoading ? (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				) : (
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Module</TableHead>
									<TableHead>Key</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Path</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pm.rows.map((screen) => (
									<TableRow key={screen.id}>
										<TableCell>
											{pm.moduleName(screen.moduleId)}
										</TableCell>
										<TableCell className='font-mono text-xs'>
											{screen.key}
										</TableCell>
										<TableCell className='font-medium'>
											{screen.name}
										</TableCell>
										<TableCell className='text-muted-foreground font-mono text-xs'>
											{screen.path}
										</TableCell>
										<TableCell className='space-x-2 text-right'>
											{pm.canEdit && (
												<ScreenDialog
													screen={screen}
													modules={pm.modules}
													trigger={
														<Button
															variant='outline'
															size='sm'
														>
															<Pencil />
														</Button>
													}
												/>
											)}
											{pm.canDelete && (
												<ConfirmDialog
													title='Delete screen'
													description={`Delete "${screen.name}"? Its grants are removed too.`}
													confirmLabel='Delete'
													onConfirm={() =>
														pm.deleteScreen(
															screen.id,
														)
													}
													trigger={
														<Button
															variant='outline'
															size='sm'
														>
															<Trash2 />
														</Button>
													}
												/>
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</>
	)
}
