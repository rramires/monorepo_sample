import { CircleCheck, Clock, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useCheckInsPM } from './use-check-ins-pm'

export function CheckIns() {
	const pm = useCheckInsPM()
	const { t } = useTranslation(['check-ins', 'common'])

	return (
		<>
			<PageTitle title={t('pageTitle')} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader title={t('title')} description={t('description')} />

				{pm.status === 'loading' && (
					<div className='text-muted-foreground flex items-center gap-2 text-sm'>
						<LoaderCircle className='size-4 animate-spin' />
						{t('loading')}
					</div>
				)}

				{pm.status === 'empty' && (
					<p className='text-muted-foreground text-sm'>
						{t('empty')}
					</p>
				)}

				{pm.status === 'list' && (
					<Card className='py-0'>
						<ul className='divide-y'>
							{pm.items.map((item) => (
								<li
									key={item.id}
									className='flex items-center justify-between gap-4 p-4'
								>
									<div className='flex items-center gap-3'>
										{item.validated ? (
											<CircleCheck className='size-5 shrink-0 text-emerald-600' />
										) : (
											<Clock className='text-muted-foreground size-5 shrink-0' />
										)}
										<span className='text-sm'>
											{item.date}
										</span>
									</div>

									<div className='flex items-center gap-3'>
										<Badge
											variant={
												item.validated
													? 'default'
													: 'outline'
											}
										>
											{item.validated
												? t('validated')
												: t('pending')}
										</Badge>

										{pm.canValidate && !item.validated && (
											<Button
												size='sm'
												variant='outline'
												disabled={
													pm.validatingId === item.id
												}
												onClick={() =>
													pm.validateCheckIn(item.id)
												}
											>
												{pm.validatingId === item.id ? (
													<LoaderCircle className='size-4 animate-spin' />
												) : null}
												{t('validate')}
											</Button>
										)}
									</div>
								</li>
							))}
						</ul>
					</Card>
				)}

				{pm.status === 'list' && (pm.hasPrevPage || pm.hasNextPage) && (
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={pm.prevPage}
							disabled={!pm.hasPrevPage}
						>
							{t('common:pagination.previous')}
						</Button>
						<span className='text-muted-foreground text-sm'>
							{t('page', { page: pm.page })}
						</span>
						<Button
							variant='outline'
							size='sm'
							onClick={pm.nextPage}
							disabled={!pm.hasNextPage}
						>
							{t('common:pagination.next')}
						</Button>
					</div>
				)}
			</div>
		</>
	)
}
