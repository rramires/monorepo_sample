import { useTranslation } from 'react-i18next'
import { useRouteError } from 'react-router'

import { PageTitle } from '@/components/title/page-title'

interface RouteError {
	statusText?: string
	message?: string
}

export function ErrorPage() {
	const error = useRouteError() as RouteError
	const { t } = useTranslation('common')
	console.error(error)

	return (
		<>
			<PageTitle title={t('errorPage.pageTitle')} />
			<div
				id='error-page'
				className='bg-background text-foreground flex h-screen flex-col items-center justify-center p-8'
			>
				<h1 className='text-3xl font-bold'>{t('errorPage.oops')}</h1>
				<p className='text-muted-foreground pt-1'>
					{t('errorPage.occurred')}
				</p>
				<p className='pt-3'>
					<i className='text-destructive'>
						{error.statusText || error.message}
					</i>
				</p>
			</div>
		</>
	)
}
