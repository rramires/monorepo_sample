import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
import { Card, CardContent } from '@/components/ui/card'

import { ProfileDialog } from './profile-dialog'
import { useProfilesPM } from './use-profiles-pm'

type ProfileRow = ReturnType<typeof useProfilesPM>['profiles'][number]

export function AdminProfiles() {
	const pm = useProfilesPM()
	const { t } = useTranslation(['admin', 'common'])

	const flagBadges = (profile: ProfileRow) => (
		<>
			{profile.isDefault && (
				<Badge variant='secondary'>{t('profiles.flags.default')}</Badge>
			)}
			{profile.isSystem && (
				<Badge variant='outline'>{t('common:status.system')}</Badge>
			)}
			{!profile.isActive && (
				<Badge variant='outline'>{t('common:status.inactive')}</Badge>
			)}
		</>
	)

	const actions = (profile: ProfileRow) => (
		<>
			<Button asChild variant='outline' size='sm'>
				<Link to={`/admin/profiles/${profile.id}`}>
					<Pencil />
					{t('profiles.grants')}
				</Link>
			</Button>
			{pm.canDelete && !profile.isSystem && (
				<ConfirmDialog
					title={t('profiles.delete.title')}
					description={t('profiles.delete.description', {
						name: profile.name,
					})}
					confirmLabel={t('profiles.delete.confirmLabel')}
					onConfirm={() => pm.deleteProfile(profile.id)}
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

	const columns: ResponsiveListColumn<ProfileRow>[] = [
		{
			key: 'key',
			header: t('profiles.columns.key'),
			cell: (profile) => profile.key,
			className: 'font-mono text-xs',
			card: 'top',
		},
		{
			key: 'name',
			header: t('profiles.columns.name'),
			cell: (profile) => profile.name,
			className: 'font-medium',
			card: 'top',
		},
		{
			key: 'flags',
			header: t('profiles.columns.flags'),
			cell: flagBadges,
			className: 'space-x-1',
			card: 'top',
		},
		{
			key: 'description',
			header: t('profiles.columns.description'),
			cell: (profile) => profile.description,
			className: 'text-muted-foreground',
			card: 'bottom',
		},
		{
			key: 'actions',
			header: t('profiles.columns.actions'),
			cell: actions,
			className: 'space-x-2 text-right',
			headClassName: 'text-right',
			card: 'actions',
		},
	]

	return (
		<>
			<PageTitle title={t('profiles.pageTitle')} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title={t('profiles.title')}
					description={t('profiles.description')}
				>
					{pm.canCreate && (
						<ProfileDialog
							trigger={
								<Button size='sm'>
									<Plus />
									{t('profiles.new')}
								</Button>
							}
						/>
					)}
				</PageHeader>

				<Card>
					<CardContent>
						{pm.isLoading ? (
							<p className='text-muted-foreground text-sm'>
								{t('common:states.loading')}
							</p>
						) : (
							<ResponsiveList
								rows={pm.profiles}
								columns={columns}
								getRowKey={(profile) => String(profile.id)}
								empty={
									<p className='text-muted-foreground text-sm'>
										{t('profiles.empty')}
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
