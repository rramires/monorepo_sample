import { LoaderCircle } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
import { PageTitle } from '@/components/title/page-title'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

import { ActivityChart } from './activity-chart'
import { useHomePM } from './use-home-pm'

export function Home() {
	const pm = useHomePM()

	return (
		<>
			<PageTitle title='Dashboard' />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title={`Welcome back, ${pm.user?.username ?? ''}!`}
					description="Here's your recent gym activity."
				/>

				<div className='grid gap-4 md:grid-cols-3'>
					<Card>
						<CardHeader>
							<CardDescription>Total check-ins</CardDescription>
							<CardTitle className='text-4xl'>
								{pm.isLoadingTotal ? '—' : pm.total}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='md:col-span-2'>
						<CardHeader>
							<CardTitle>Recent activity</CardTitle>
							<CardDescription>
								Check-ins over the last 7 days
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pm.isLoadingActivity ? (
								<div className='text-muted-foreground flex h-[200px] items-center gap-2 text-sm'>
									<LoaderCircle className='size-4 animate-spin' />
									Loading activity…
								</div>
							) : (
								<ActivityChart data={pm.activity} />
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	)
}
