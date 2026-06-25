import { LoaderCircle, Plus } from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/page-header'
import { Pager } from '@/components/pager/pager'
import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { GymCard } from './gym-card'
import { useGymsPM } from './use-gyms-pm'

export function Gyms() {
	const pm = useGymsPM()

	return (
		<>
			<PageTitle title='Gyms' />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title='Gyms'
					description='Find a gym near you, or search by name.'
				>
					{pm.canCreate && (
						<Button asChild size='sm'>
							<Link to='/gyms/new'>
								<Plus />
								New gym
							</Link>
						</Button>
					)}
				</PageHeader>

				<div className='grid items-center gap-4 sm:grid-cols-2'>
					<Input
						placeholder='Search gyms by name…'
						value={pm.query}
						onChange={(event) =>
							pm.handleQueryChange(event.target.value)
						}
						className='w-full'
					/>
					{pm.canManage && (
						<div className='flex flex-wrap items-center gap-4'>
							<Label className='text-muted-foreground flex items-center gap-2 text-sm font-normal'>
								<Checkbox
									checked={pm.nearbyMode}
									onCheckedChange={(value) =>
										pm.setNearbyMode(value === true)
									}
								/>
								Nearby only
							</Label>
							<Label className='text-muted-foreground flex items-center gap-2 text-sm font-normal'>
								<Checkbox
									checked={pm.showDeactivated}
									onCheckedChange={(value) =>
										pm.setShowDeactivated(value === true)
									}
								/>
								Show deactivated
							</Label>
						</div>
					)}
				</div>

				{pm.status === 'geo-denied' && (
					<p className='text-muted-foreground text-sm'>
						Couldn&apos;t get your location — search by name above.
					</p>
				)}

				{pm.status === 'locating' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Finding gyms near you…
					</div>
				)}

				{pm.status === 'loading' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						Loading gyms…
					</div>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						{pm.searching
							? 'No gyms match your search.'
							: pm.canManage && !pm.nearbyMode
								? 'No gyms yet.'
								: 'No gyms found near you.'}
					</p>
				)}

				{pm.status === 'list' && (
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
						{pm.gyms.map((gym) => (
							<GymCard key={gym.id} gym={gym} />
						))}
					</div>
				)}

				{pm.pager && pm.status === 'list' && (
					<>
						<Separator />
						<Pager
							from={pm.pager.from}
							to={pm.pager.to}
							total={pm.pager.total}
							canPrev={pm.pager.canPrev}
							canNext={pm.pager.canNext}
							onFirst={pm.firstPage}
							onPrev={pm.prevPage}
							onNext={pm.nextPage}
							onLast={pm.lastPage}
						/>
					</>
				)}
			</div>
		</>
	)
}
