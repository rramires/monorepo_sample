import { Pencil, Plus, Trash2 } from 'lucide-react'

import { ConfirmDialog } from '@/components/confirm-dialog'
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

import { ModuleDialog } from './module-dialog'
import { useModulesPM } from './use-modules-pm'

export function AdminModules() {
	const pm = useModulesPM()

	return (
		<>
			<PageTitle title='Manage Modules' />

			<div className='flex flex-1 flex-col gap-4 p-8'>
				<div className='flex items-start justify-between gap-4'>
					<div>
						<h1 className='text-2xl font-bold'>Modules</h1>
						<p className='text-muted-foreground text-sm'>
							Modules group related screens.
						</p>
					</div>
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
				</div>

				{pm.isLoading ? (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				) : (
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Key</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Order</TableHead>
									<TableHead>Description</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pm.modules.map((module) => (
									<TableRow key={module.id}>
										<TableCell className='font-mono text-xs'>
											{module.key}
										</TableCell>
										<TableCell className='space-x-1 font-medium'>
											{module.name}
											{module.isSystem && (
												<Badge variant='outline'>
													System
												</Badge>
											)}
										</TableCell>
										<TableCell>{module.order}</TableCell>
										<TableCell className='text-muted-foreground'>
											{module.description}
										</TableCell>
										<TableCell className='space-x-2 text-right'>
											{pm.canEdit && (
												<ModuleDialog
													module={module}
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
												!module.isSystem && (
													<ConfirmDialog
														title='Delete module'
														description={`Delete "${module.name}"? Screens must be removed first.`}
														confirmLabel='Delete'
														onConfirm={() =>
															pm.deleteModule(
																module.id,
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
