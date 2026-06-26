import { Controller } from 'react-hook-form'
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
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'

import { useForgotPasswordPM } from './use-forgot-password-pm'

export function ForgotPassword() {
	const pm = useForgotPasswordPM()
	const { t } = useTranslation('auth')

	return (
		<>
			<PageTitle title={t('forgotPassword.pageTitle')} />

			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-sm'>
					{pm.step === 'request' ? (
						<>
							<CardHeader>
								<CardTitle>
									{t('forgotPassword.request.title')}
								</CardTitle>
								<CardDescription>
									{t('forgotPassword.request.description')}
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleRequest}>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='email'>
												{t(
													'forgotPassword.request.emailLabel',
												)}
											</Label>
											<Input
												id='email'
												type='email'
												autoFocus
												placeholder={t(
													'forgotPassword.request.emailPlaceholder',
												)}
												{...pm.register('email')}
											/>
											{pm.errors.email && (
												<p className='text-destructive text-sm'>
													{pm.errors.email.message}
												</p>
											)}
										</div>

										<Button
											type='submit'
											disabled={pm.isSubmitting}
											className='w-full'
										>
											{t('forgotPassword.request.submit')}
										</Button>
									</div>
								</form>
							</CardContent>
						</>
					) : (
						<>
							<CardHeader>
								<CardTitle>
									{t('forgotPassword.reset.title')}
								</CardTitle>
								<CardDescription>
									{t('forgotPassword.reset.description', {
										email: pm.email,
									})}
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleReset}>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='code'>
												{t(
													'forgotPassword.reset.codeLabel',
												)}
											</Label>
											<Controller
												control={pm.resetControl}
												name='code'
												render={({ field }) => (
													<InputOTP
														autoFocus
														maxLength={6}
														value={
															field.value ?? ''
														}
														onChange={
															field.onChange
														}
													>
														<InputOTPGroup>
															<InputOTPSlot
																index={0}
															/>
															<InputOTPSlot
																index={1}
															/>
															<InputOTPSlot
																index={2}
															/>
															<InputOTPSlot
																index={3}
															/>
															<InputOTPSlot
																index={4}
															/>
															<InputOTPSlot
																index={5}
															/>
														</InputOTPGroup>
													</InputOTP>
												)}
											/>
											{pm.resetErrors.code && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors.code
															.message
													}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='password'>
												{t(
													'forgotPassword.reset.newPasswordLabel',
												)}
											</Label>
											<Input
												id='password'
												type='password'
												{...pm.resetRegister(
													'password',
												)}
											/>
											{pm.resetErrors.password && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors.password
															.message
													}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='confirmPassword'>
												{t(
													'forgotPassword.reset.confirmPasswordLabel',
												)}
											</Label>
											<Input
												id='confirmPassword'
												type='password'
												{...pm.resetRegister(
													'confirmPassword',
												)}
											/>
											{pm.resetErrors.confirmPassword && (
												<p className='text-destructive text-sm'>
													{
														pm.resetErrors
															.confirmPassword
															.message
													}
												</p>
											)}
										</div>

										<Button
											type='submit'
											disabled={pm.resetIsSubmitting}
											className='w-full'
										>
											{t('forgotPassword.reset.submit')}
										</Button>

										<button
											type='button'
											onClick={pm.backToRequest}
											className='text-muted-foreground text-sm underline-offset-4 hover:underline'
										>
											{t(
												'forgotPassword.reset.differentEmail',
											)}
										</button>
									</div>
								</form>
							</CardContent>
						</>
					)}

					<div className='text-center text-sm'>
						<Link
							to='/sign-in'
							className='underline-offset-4 hover:underline'
						>
							{t('forgotPassword.backToLogin')}
						</Link>
					</div>
				</Card>
			</div>
		</>
	)
}
