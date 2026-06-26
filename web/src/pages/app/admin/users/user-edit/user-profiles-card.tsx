import { useTranslation } from 'react-i18next'

import type { ProfileModel } from '@/api/profiles'
import { type TransferColumn, TransferTable } from '@/components/transfer-table'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

import { useUserProfilesPM } from './use-user-profiles-pm'

export function UserProfilesCard({
	userId,
	userIsAdmin,
}: {
	userId: string
	userIsAdmin: boolean
}) {
	const pm = useUserProfilesPM(userId)
	const { t } = useTranslation('admin')

	const profileColumn: TransferColumn<ProfileModel> = {
		key: 'name',
		header: t('users.profiles.columnHeader'),
		cell: (p) => (
			<div className='flex flex-col'>
				<span className='font-medium'>{p.name}</span>
				<span className='text-muted-foreground text-xs'>{p.key}</span>
			</div>
		),
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('users.profiles.title')}</CardTitle>
				<CardDescription>
					{t('users.profiles.description')}
				</CardDescription>
			</CardHeader>
			<CardContent className='flex flex-col gap-4'>
				{userIsAdmin ? (
					<p className='text-muted-foreground text-sm'>
						{t('users.profiles.adminNote')}
					</p>
				) : (
					<>
						<TransferTable
							items={pm.profiles}
							getRowId={(p) => p.id}
							assignedIds={pm.assignedIds}
							onAssignedChange={pm.setAssignedIds}
							availableColumns={[profileColumn]}
							assignedColumns={[profileColumn]}
							searchable
							getSearchText={(p) => `${p.name} ${p.key}`}
						/>
						{pm.canEdit && (
							<div className='flex justify-end'>
								<Button
									onClick={pm.save}
									disabled={pm.isSaving}
								>
									{t('users.profiles.save')}
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}
