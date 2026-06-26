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

import { useConfirmEmailChangePM } from './use-confirm-email-change-pm'

export function ConfirmEmailChange() {
	const pm = useConfirmEmailChangePM()
	const { t } = useTranslation('auth')

	return (
		<>
			<PageTitle title={t('confirmEmailChange.pageTitle')} />

			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-sm text-center'>
					{pm.status === 'verifying' && (
						<CardHeader>
							<LoaderCircle className='text-muted-foreground mx-auto size-10 animate-spin' />
							<CardTitle>
								{t('confirmEmailChange.verifying.title')}
							</CardTitle>
							<CardDescription>
								{t('confirmEmailChange.verifying.description')}
							</CardDescription>
						</CardHeader>
					)}

					{pm.status === 'success' && (
						<>
							<CardHeader>
								<CheckCircle2 className='mx-auto size-10 text-emerald-500' />
								<CardTitle>
									{t('confirmEmailChange.success.title')}
								</CardTitle>
								<CardDescription>
									{t(
										'confirmEmailChange.success.description',
									)}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link
										to={
											pm.isAuthed
												? '/account'
												: '/sign-in'
										}
									>
										{pm.isAuthed
											? t(
													'confirmEmailChange.backToAccount',
												)
											: t('confirmEmailChange.signIn')}
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
									{t('confirmEmailChange.error.title')}
								</CardTitle>
								<CardDescription>
									{t('confirmEmailChange.error.description')}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild className='w-full'>
									<Link
										to={
											pm.isAuthed
												? '/account'
												: '/sign-in'
										}
									>
										{pm.isAuthed
											? t(
													'confirmEmailChange.backToAccount',
												)
											: t('confirmEmailChange.signIn')}
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
