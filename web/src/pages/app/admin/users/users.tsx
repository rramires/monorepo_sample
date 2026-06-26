import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { PageHeader } from '@/components/page-header'
import { Pager } from '@/components/pager/pager'
import {
	ResponsiveList,
	type ResponsiveListColumn,
} from '@/components/responsive-list/responsive-list'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { useUsersPM } from './use-users-pm'

type UserRow = ReturnType<typeof useUsersPM>['rows'][number]

export function AdminUsers() {
	const pm = useUsersPM()
	const { t } = useTranslation(['admin', 'common'])

	const roleBadge = (row: UserRow) => (
		<Badge variant={row.role === 'ADMIN' ? 'default' : 'secondary'}>
			{row.role === 'ADMIN'
				? t('common:roles.admin')
				: t('common:roles.member')}
		</Badge>
	)

	const statusBadges = (row: UserRow) => (
		<>
			<Badge variant={row.verified ? 'default' : 'outline'}>
				{row.verified ? t('users.verified') : t('users.unverified')}
			</Badge>
			{!row.active && (
				<Badge variant='destructive'>
					{t('common:status.inactive')}
				</Badge>
			)}
		</>
	)

	const editButton = (row: UserRow) => (
		<Button asChild variant='outline' size='sm' className='w-16 lg:w-auto'>
			<Link
				to={`/admin/users/${row.id}`}
				aria-label={t('common:actions.edit')}
			>
				<Pencil />
			</Link>
		</Button>
	)

	const columns: ResponsiveListColumn<UserRow>[] = [
		{
			key: 'username',
			header: t('users.columns.username'),
			cell: (row) => row.username,
			className: 'font-medium',
			card: 'top',
		},
		{
			key: 'email',
			header: t('users.columns.email'),
			cell: (row) => row.email,
			card: 'top',
		},
		{
			key: 'role',
			header: t('users.columns.role'),
			cell: roleBadge,
			card: 'top',
		},
		{
			key: 'status',
			header: t('users.columns.status'),
			cell: statusBadges,
			className: 'space-x-1',
			card: 'bottom',
		},
		{
			key: 'created',
			header: t('users.columns.created'),
			cell: (row) => row.created,
			className: 'text-muted-foreground',
			card: 'bottom',
		},
		{
			key: 'actions',
			header: t('users.columns.actions'),
			cell: editButton,
			className: 'text-right',
			headClassName: 'text-right',
			card: 'actions',
		},
	]

	return (
		<>
			<PageTitle title={t('users.pageTitle')} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title={t('users.title')}
					description={t('users.description')}
				/>

				<Card>
					<CardContent>
						{pm.status === 'loading' && (
							<p className='text-muted-foreground text-sm'>
								{t('users.loading')}
							</p>
						)}

						{pm.status === 'empty' && (
							<p className='text-muted-foreground text-sm'>
								{t('users.empty')}
							</p>
						)}

						{pm.status === 'list' && (
							<ResponsiveList
								rows={pm.rows}
								columns={columns}
								getRowKey={(row) => String(row.id)}
							/>
						)}
					</CardContent>
				</Card>

				{pm.status === 'list' && (
					<Pager
						from={pm.from}
						to={pm.to}
						total={pm.total}
						canPrev={pm.hasPrevPage}
						canNext={pm.hasNextPage}
						onFirst={pm.firstPage}
						onPrev={pm.prevPage}
						onNext={pm.nextPage}
						onLast={pm.lastPage}
					/>
				)}
			</div>
		</>
	)
}
