import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { ProfileDialog } from './profile-dialog'
import { useProfilesPM } from './use-profiles-pm'

type ProfileRow = ReturnType<typeof useProfilesPM>['profiles'][number]

function flagBadges(profile: ProfileRow) {
	return (
		<>
			{profile.isDefault && <Badge variant='secondary'>Default</Badge>}
			{profile.isSystem && <Badge variant='outline'>System</Badge>}
		</>
	)
}

export function AdminProfiles() {
	const pm = useProfilesPM()

	const actions = (profile: ProfileRow) => (
		<>
			<Button asChild variant='outline' size='sm'>
				<Link to={`/admin/profiles/${profile.id}`}>
					<Pencil />
					Grants
				</Link>
			</Button>
			{pm.canDelete && !profile.isSystem && (
				<ConfirmDialog
					title='Delete profile'
					description={`Delete "${profile.name}"? Users lose this profile.`}
					confirmLabel='Delete'
					onConfirm={() => pm.deleteProfile(profile.id)}
					trigger={
						<Button variant='outline' size='sm'>
							<Trash2 />
						</Button>
					}
				/>
			)}
		</>
	)

	const columns: ResponsiveListColumn<ProfileRow>[] = [
		{
			key: 'key',
			header: 'Key',
			cell: (profile) => profile.key,
			className: 'font-mono text-xs',
			card: 'top',
		},
		{
			key: 'name',
			header: 'Name',
			cell: (profile) => profile.name,
			className: 'font-medium',
			card: 'top',
		},
		{
			key: 'flags',
			header: 'Flags',
			cell: flagBadges,
			className: 'space-x-1',
			card: 'top',
		},
		{
			key: 'description',
			header: 'Description',
			cell: (profile) => profile.description,
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
					<ResponsiveList
						rows={pm.profiles}
						columns={columns}
						getRowKey={(profile) => String(profile.id)}
						empty={
							<p className='text-muted-foreground text-sm'>
								No profiles found.
							</p>
						}
					/>
				)}
			</div>
		</>
	)
}
