import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation('check-ins')

	return (
		<>
			<PageTitle title={t('dashboard.pageTitle')} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					title={t('dashboard.welcome', {
						name: pm.user?.username ?? '',
					})}
					description={t('dashboard.welcomeDescription')}
				/>

				<div className='grid gap-4 md:grid-cols-3'>
					<Card>
						<CardHeader>
							<CardDescription>
								{t('dashboard.totalCheckIns')}
							</CardDescription>
							<CardTitle className='text-4xl'>
								{pm.isLoadingTotal ? '—' : pm.total}
							</CardTitle>
						</CardHeader>
					</Card>

					<Card className='md:col-span-2'>
						<CardHeader>
							<CardTitle>
								{t('dashboard.recentActivity')}
							</CardTitle>
							<CardDescription>
								{t('dashboard.recentActivityDescription')}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{pm.isLoadingActivity ? (
								<div className='text-muted-foreground flex h-[200px] items-center gap-2 text-sm'>
									<LoaderCircle className='size-4 animate-spin' />
									{t('dashboard.loadingActivity')}
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
