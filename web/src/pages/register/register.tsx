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

import { useRegisterPM } from './use-register-pm'

export function Register() {
	const pm = useRegisterPM()
	const { t } = useTranslation('auth')

	return (
		<>
			<PageTitle title={t('register.pageTitle')} />

			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>{t('register.title')}</CardTitle>
						<CardDescription>
							{t('register.description')}
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit}>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='username'>
										{t('register.usernameLabel')}
									</Label>
									<Input
										id='username'
										type='text'
										autoFocus
										placeholder={t(
											'register.usernamePlaceholder',
										)}
										{...pm.register('username')}
									/>
									{pm.errors.username && (
										<p className='text-destructive text-sm'>
											{pm.errors.username.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='email'>
										{t('register.emailLabel')}
									</Label>
									<Input
										id='email'
										type='email'
										placeholder={t(
											'register.emailPlaceholder',
										)}
										{...pm.register('email')}
									/>
									{pm.errors.email && (
										<p className='text-destructive text-sm'>
											{pm.errors.email.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='password'>
										{t('register.passwordLabel')}
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

								<div className='grid gap-2'>
									<Label htmlFor='confirmPassword'>
										{t('register.confirmPasswordLabel')}
									</Label>
									<Input
										id='confirmPassword'
										type='password'
										{...pm.register('confirmPassword')}
									/>
									{pm.errors.confirmPassword && (
										<p className='text-destructive text-sm'>
											{pm.errors.confirmPassword.message}
										</p>
									)}
								</div>

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									{t('register.submit')}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}
