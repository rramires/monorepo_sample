import { ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'

// Shown in place of a gated page. Defaults to the admin-only message; the route
// guard passes the access-specific copy (no view grant vs. killed screen).
export function Forbidden({
	title,
	message,
}: {
	title?: string
	message?: string
} = {}) {
	const { t } = useTranslation('auth')

	return (
		<>
			<PageTitle title={t('forbidden.pageTitle')} />

			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
				<ShieldX className='text-muted-foreground size-10' />
				<div>
					<h2 className='text-2xl font-medium'>
						{title ?? t('forbidden.adminsOnlyTitle')}
					</h2>
					<p className='text-muted-foreground text-sm'>
						{message ?? t('forbidden.adminsOnlyMessage')}
					</p>
				</div>
				<Button asChild>
					<Link to='/'>{t('forbidden.back')}</Link>
				</Button>
			</div>
		</>
	)
}
