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

const profileColumn: TransferColumn<ProfileModel> = {
	key: 'name',
	header: 'Profile',
	cell: (p) => (
		<div className='flex flex-col'>
			<span className='font-medium'>{p.name}</span>
			<span className='text-muted-foreground text-xs'>{p.key}</span>
		</div>
	),
}

export function UserProfilesCard({
	userId,
	userIsAdmin,
}: {
	userId: string
	userIsAdmin: boolean
}) {
	const pm = useUserProfilesPM(userId)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profiles</CardTitle>
				<CardDescription>
					Assign profiles to grant this user their screens.
				</CardDescription>
			</CardHeader>
			<CardContent className='flex flex-col gap-4'>
				{userIsAdmin ? (
					<p className='text-muted-foreground text-sm'>
						All profiles and screens are assigned to the admin.
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
							labels={{
								available: 'Available',
								assigned: 'Assigned',
							}}
							searchable
							getSearchText={(p) => `${p.name} ${p.key}`}
						/>
						{pm.canEdit && (
							<div className='flex justify-end'>
								<Button
									onClick={pm.save}
									disabled={pm.isSaving}
								>
									Save profiles
								</Button>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	)
}
