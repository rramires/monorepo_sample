import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

import { useVerifyEmailPM } from './use-verify-email-pm'

export function VerifyEmail() {
	const pm = useVerifyEmailPM()
	const { t } = useTranslation('auth')

	return (
		<>
			<PageTitle title={t('verifyEmail.pageTitle')} />

			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-sm text-center'>
					{pm.status === 'verifying' && (
						<CardHeader>
							<LoaderCircle className='text-muted-foreground mx-auto size-10 animate-spin' />
							<CardTitle>
								{t('verifyEmail.verifying.title')}
							</CardTitle>
							<CardDescription>
								{t('verifyEmail.verifying.description')}
							</CardDescription>
						</CardHeader>
					)}

					{pm.status === 'success' && (
						<>
							<CardHeader>
								<CheckCircle2 className='mx-auto size-10 text-emerald-500' />
								<CardTitle>
									{t('verifyEmail.success.title')}
								</CardTitle>
								<CardDescription>
									{t('verifyEmail.success.description')}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link to={pm.isAuthed ? '/' : '/sign-in'}>
										{pm.isAuthed
											? t('verifyEmail.goToApp')
											: t('verifyEmail.signIn')}
									</Link>
								</Button>
							</CardContent>
						</>
					)}

					{pm.status === 'error' && (
						<>
							<CardHeader>
								<XCircle className='text-destructive mx-auto size-10' />
								<CardTitle>
									{t('verifyEmail.error.title')}
								</CardTitle>
								<CardDescription>
									{t('verifyEmail.error.description')}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link to={pm.isAuthed ? '/' : '/sign-in'}>
										{pm.isAuthed
											? t('verifyEmail.goToApp')
											: t('verifyEmail.signIn')}
									</Link>
								</Button>
							</CardContent>
						</>
					)}
				</Card>
			</div>
		</>
	)
}
