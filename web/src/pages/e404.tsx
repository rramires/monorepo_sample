import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'

export function NotFound() {
	const { t } = useTranslation('common')

	return (
		<>
			<PageTitle title={t('errorPage.notFoundPageTitle')} />
			<div className='bg-background text-foreground flex h-screen flex-col items-center justify-center p-8'>
				<h1 className='text-3xl font-bold'>
					{t('errorPage.notFoundTitle')}
				</h1>
				<p className='text-muted-foreground pt-3'>
					<Link
						to='/'
						className='hover:text-foreground hover:underline'
					>
						{t('errorPage.returnHome')}
					</Link>
				</p>
			</div>
		</>
	)
}
