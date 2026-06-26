import { useTranslation } from 'react-i18next'

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

import { useProfileCardPM } from './use-profile-card-pm'

export function ProfileCard() {
	const pm = useProfileCardPM()
	const { t } = useTranslation(['account', 'common'])

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('profile.title')}</CardTitle>
				<CardDescription>{t('profile.description')}</CardDescription>
			</CardHeader>

			<CardContent>
				<form onSubmit={pm.handleSubmit} noValidate>
					<div className='flex flex-col gap-6'>
						<div className='grid gap-2'>
							<Label htmlFor='username'>
								{t('profile.usernameLabel')}
							</Label>
							<Input id='username' {...pm.register('username')} />
							{pm.errors.username && (
								<p className='text-destructive text-sm'>
									{pm.errors.username.message}
								</p>
							)}
						</div>

						<Button
							type='submit'
							disabled={pm.isSubmitting || !pm.isDirty}
							className='w-full'
						>
							{t('common:actions.save')}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
