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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useSignInPM } from './use-sign-in-pm'

export function SignIn() {
	const pm = useSignInPM()
	const { t } = useTranslation('auth')

	return (
		<>
			<PageTitle title={t('signIn.pageTitle')} />

			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>{t('signIn.title')}</CardTitle>
						<CardDescription>
							{t('signIn.description')}
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit}>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='identifier'>
										{t('signIn.identifierLabel')}
									</Label>
									<Input
										id='identifier'
										type='text'
										autoFocus
										placeholder={t(
											'signIn.identifierPlaceholder',
										)}
										{...pm.register('identifier')}
									/>
									{pm.errors.identifier && (
										<p className='text-destructive text-sm'>
											{pm.errors.identifier.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='password'>
										{t('signIn.passwordLabel')}
									</Label>
									<Input
										id='password'
										type='password'
										{...pm.register('password')}
									/>
									{pm.errors.password && (
										<p className='text-destructive text-sm'>
											{pm.errors.password.message}
										</p>
									)}
								</div>

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									{t('signIn.submit')}
								</Button>

								{/* After the primary action in tab order: a
								    keyboard login is identifier → password →
								    Sign in → Forgot. */}
								<Link
									to='/forgot-password'
									className='text-muted-foreground text-center text-sm underline-offset-4 hover:underline'
								>
									{t('signIn.forgot')}
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}
