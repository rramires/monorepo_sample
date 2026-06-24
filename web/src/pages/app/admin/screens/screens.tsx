import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
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
										<TableCell className='space-x-1 font-medium'>
											{screen.name}
											{screen.isSystem && (
												<Badge variant='outline'>
													System
												</Badge>
											)}
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
											{pm.canDelete &&
												!screen.isSystem && (
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
