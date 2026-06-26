import { useTranslation } from 'react-i18next'

import { PageTitle } from '@/components/title/page-title'

import { EmailCard } from './email-card'
import { LandingCard } from './landing-card'
import { ProfileCard } from './profile-card'

export function Account() {
	const { t } = useTranslation('account')

	return (
		<>
			<PageTitle title={t('pageTitle')} />

			<div className='flex flex-1 flex-col items-center p-8'>
				<div className='flex w-full max-w-lg flex-col gap-6'>
					<ProfileCard />
					<LandingCard />
					<EmailCard />
				</div>
			</div>
		</>
	)
}
