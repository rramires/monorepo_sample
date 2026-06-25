import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	LoaderCircle,
	Plus,
} from 'lucide-react'
import { Link } from 'react-router'

import { PageHeader } from '@/components/page-header'
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

				<div className='flex flex-wrap items-center gap-4'>
					<Input
						placeholder='Search gyms by name…'
						value={pm.query}
						onChange={(event) =>
							pm.handleQueryChange(event.target.value)
						}
						className='w-full sm:w-1/2'
					/>
					{pm.canManage && (
						<div className='flex items-center gap-4'>
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
						<div className='flex items-center justify-end gap-2'>
							<span className='text-muted-foreground mr-2 text-sm'>
								{pm.pager.from} to {pm.pager.to} of{' '}
								{pm.pager.total}
							</span>
							<Button
								variant='outline'
								size='icon'
								onClick={pm.firstPage}
								disabled={!pm.pager.canPrev}
								aria-label='First page'
							>
								<ChevronsLeft />
							</Button>
							<Button
								variant='outline'
								size='icon'
								onClick={pm.prevPage}
								disabled={!pm.pager.canPrev}
								aria-label='Previous page'
							>
								<ChevronLeft />
							</Button>
							<Button
								variant='outline'
								size='icon'
								onClick={pm.nextPage}
								disabled={!pm.pager.canNext}
								aria-label='Next page'
							>
								<ChevronRight />
							</Button>
							<Button
								variant='outline'
								size='icon'
								onClick={pm.lastPage}
								disabled={!pm.pager.canNext}
								aria-label='Last page'
							>
								<ChevronsRight />
							</Button>
						</div>
					</>
				)}
			</div>
		</>
	)
}
