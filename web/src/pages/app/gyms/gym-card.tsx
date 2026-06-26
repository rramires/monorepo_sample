import { CircleCheck, LoaderCircle, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { Gym } from '@/api/search-gyms'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

import { EditGymDialog } from './edit-gym-dialog'
import { useGymCardPM } from './use-gym-card-pm'

export function GymCard({ gym }: { gym: Gym }) {
	const pm = useGymCardPM(gym)
	const { t } = useTranslation(['gyms', 'common'])

	return (
		<Card className='flex flex-col'>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<span>{gym.title}</span>
					{!gym.is_active && (
						<Badge variant='destructive'>
							{t('common:status.inactive')}
						</Badge>
					)}
				</CardTitle>
				{gym.description && (
					<CardDescription>{gym.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent className='text-muted-foreground flex-1 space-y-1 text-sm'>
				<div className='flex items-center gap-2'>
					<MapPin className='size-4 shrink-0' />
					<span>
						{gym.latitude.toFixed(4)}, {gym.longitude.toFixed(4)}
					</span>
				</div>
				{gym.phone && (
					<div className='flex items-center gap-2'>
						<Phone className='size-4 shrink-0' />
						<span>{gym.phone}</span>
					</div>
				)}
			</CardContent>
			<CardFooter className='flex-col gap-2'>
				{/* Check-in needs the gym.gyms `create_checkin` grant; members
				    without it never see the button (the action also 403s). */}
				{pm.canCheckIn && (
					<Button
						variant='outline'
						className='w-full'
						disabled={pm.isCheckingIn || !gym.is_active}
						onClick={pm.checkIn}
					>
						{pm.isCheckingIn ? (
							<LoaderCircle className='size-4 animate-spin' />
						) : (
							<CircleCheck className='size-4' />
						)}
						{t('gyms:card.checkIn')}
					</Button>
				)}

				{/* Editing a gym needs the gym.gyms `edit` grant (the route-level
				    guard still protects it; hiding the button is just UX). */}
				{pm.canEdit && <EditGymDialog gym={gym} />}
			</CardFooter>
		</Card>
	)
}
