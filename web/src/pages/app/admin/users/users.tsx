import { Link } from 'react-router'

import { PageHeader } from '@/components/page-header'
import {
	DataCard,
	InitialsAvatar,
} from '@/components/responsive-list/data-card'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { useUsersPM } from './use-users-pm'

type UserRow = ReturnType<typeof useUsersPM>['rows'][number]

function roleBadge(row: UserRow) {
	return (
		<Badge variant={row.role === 'ADMIN' ? 'default' : 'secondary'}>
			{row.role === 'ADMIN' ? 'Admin' : 'Member'}
		</Badge>
	)
}

function statusBadges(row: UserRow) {
	return (
		<>
			<Badge variant={row.verified ? 'default' : 'outline'}>
				{row.verified ? 'Verified' : 'Unverified'}
			</Badge>
			{!row.active && <Badge variant='destructive'>Inactive</Badge>}
		</>
	)
}

function editButton(row: UserRow) {
	return (
		<Button asChild variant='outline' size='sm'>
			<Link to={`/admin/users/${row.id}`}>Edit</Link>
		</Button>
	)
}

const columns: ResponsiveListColumn<UserRow>[] = [
	{
		key: 'username',
		header: 'Username',
		cell: (row) => row.username,
		className: 'font-medium',
	},
	{ key: 'email', header: 'Email', cell: (row) => row.email },
	{ key: 'role', header: 'Role', cell: roleBadge },
	{
		key: 'status',
		header: 'Status',
		cell: statusBadges,
		className: 'space-x-1',
	},
	{
		key: 'created',
		header: 'Created',
		cell: (row) => row.created,
		className: 'text-muted-foreground',
	},
	{
		key: 'actions',
		header: 'Actions',
		cell: editButton,
		className: 'text-right',
		headClassName: 'text-right',
	},
]

function renderUserCard(row: UserRow) {
	return (
		<DataCard
			avatar={<InitialsAvatar name={row.username} />}
			primary={row.username}
			secondary={row.email}
			badges={
				<>
					{roleBadge(row)}
					{statusBadges(row)}
				</>
			}
			footer={
				<>
					<span className='text-muted-foreground text-sm'>
						Created {row.created}
					</span>
					{editButton(row)}
				</>
			}
		/>
	)
}

export function AdminUsers() {
	const pm = useUsersPM()

	return (
		<>
			<PageTitle title='Users' />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title='Users'
					description='Manage member and admin accounts.'
				/>

				{pm.status === 'loading' && (
					<p className='text-muted-foreground text-sm'>Loading…</p>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						No users found.
					</p>
				)}

				{pm.status === 'list' && (
					<ResponsiveList
						rows={pm.rows}
						columns={columns}
						getRowKey={(row) => String(row.id)}
						renderCard={renderUserCard}
					/>
				)}

				<div className='flex items-center justify-end gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.prevPage}
						disabled={!pm.hasPrevPage}
					>
						Previous
					</Button>
					<span className='text-muted-foreground text-sm'>
						Page {pm.page}
					</span>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.nextPage}
						disabled={!pm.hasNextPage}
					>
						Next
					</Button>
				</div>
			</div>
		</>
	)
}
