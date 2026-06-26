import { Crosshair } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useNewGymPM } from './use-new-gym-pm'

export function NewGym() {
	const pm = useNewGymPM()
	const { t } = useTranslation('gyms')

	return (
		<>
			<PageTitle title={t('new.pageTitle')} />

			<div className='flex flex-1 justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-lg'>
					<CardHeader>
						<CardTitle>{t('new.title')}</CardTitle>
						<CardDescription>
							{t('new.description')}
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit} noValidate>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='title'>
										{t('new.titleLabel')}
									</Label>
									<Input
										id='title'
										autoFocus
										{...pm.register('title')}
									/>
									{pm.errors.title && (
										<p className='text-destructive text-sm'>
											{pm.errors.title.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='description'>
										{t('new.descriptionLabel')}
									</Label>
									<Input
										id='description'
										{...pm.register('description')}
									/>
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='phone'>
										{t('new.phoneLabel')}
									</Label>
									<Input
										id='phone'
										{...pm.register('phone')}
									/>
									{pm.errors.phone && (
										<p className='text-destructive text-sm'>
											{pm.errors.phone.message}
										</p>
									)}
								</div>

								<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
									<div className='grid gap-2'>
										<Label htmlFor='latitude'>
											{t('new.latitudeLabel')}
										</Label>
										<Input
											id='latitude'
											{...pm.register('latitude')}
										/>
										{pm.errors.latitude && (
											<p className='text-destructive text-sm'>
												{pm.errors.latitude.message}
											</p>
										)}
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='longitude'>
											{t('new.longitudeLabel')}
										</Label>
										<Input
											id='longitude'
											{...pm.register('longitude')}
										/>
										{pm.errors.longitude && (
											<p className='text-destructive text-sm'>
												{pm.errors.longitude.message}
											</p>
										)}
									</div>
								</div>

								<Button
									type='button'
									variant='outline'
									onClick={pm.handleUseMyLocation}
									disabled={pm.locating}
								>
									<Crosshair />
									{t('new.useMyLocation')}
								</Button>

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									{t('new.create')}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}
