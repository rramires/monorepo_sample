import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

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

import { ProfileDialog } from './profile-dialog'
import { useProfilesPM } from './use-profiles-pm'

export function AdminProfiles() {
	const pm = useProfilesPM()

	return (
		<>
			<PageTitle title='Manage Profiles' />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title='Profiles'
					description='A profile bundles screen grants assigned to users.'
				>
					{pm.canCreate && (
						<ProfileDialog
							trigger={
								<Button size='sm'>
									<Plus />
									New profile
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
									<TableHead>Key</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Flags</TableHead>
									<TableHead>Description</TableHead>
									<TableHead className='text-right'>
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pm.profiles.map((profile) => (
									<TableRow key={profile.id}>
										<TableCell className='font-mono text-xs'>
											{profile.key}
										</TableCell>
										<TableCell className='font-medium'>
											{profile.name}
										</TableCell>
										<TableCell className='space-x-1'>
											{profile.isDefault && (
												<Badge variant='secondary'>
													Default
												</Badge>
											)}
											{profile.isSystem && (
												<Badge variant='outline'>
													System
												</Badge>
											)}
										</TableCell>
										<TableCell className='text-muted-foreground'>
											{profile.description}
										</TableCell>
										<TableCell className='space-x-2 text-right'>
											<Button
												asChild
												variant='outline'
												size='sm'
											>
												<Link
													to={`/admin/profiles/${profile.id}`}
												>
													<Pencil />
													Grants
												</Link>
											</Button>
											{pm.canDelete &&
												!profile.isSystem && (
													<ConfirmDialog
														title='Delete profile'
														description={`Delete "${profile.name}"? Users lose this profile.`}
														confirmLabel='Delete'
														onConfirm={() =>
															pm.deleteProfile(
																profile.id,
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
