import { Controller } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'

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

import { useEmailCardPM } from './use-email-card-pm'

export function EmailCard() {
	const pm = useEmailCardPM()
	const { t } = useTranslation(['account', 'common'])

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('email.title')}</CardTitle>
				<CardDescription>{t('email.description')}</CardDescription>
			</CardHeader>

			<CardContent>
				{pm.state === 'idle' && (
					<Button variant='outline' onClick={pm.startEditing}>
						{t('email.changeEmail')}
					</Button>
				)}

				{pm.state === 'editing' && (
					<form onSubmit={pm.handleRequest} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='new-email'>
									{t('email.newEmailLabel')}
								</Label>
								<Input
									id='new-email'
									type='email'
									placeholder={t('email.newEmailPlaceholder')}
									{...pm.register('email')}
								/>
								{pm.errors.email && (
									<p className='text-destructive text-sm'>
										{pm.errors.email.message}
									</p>
								)}
							</div>

							<div className='flex gap-2'>
								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='flex-1'
								>
									{t('email.sendConfirmation')}
								</Button>
								<Button
									type='button'
									variant='ghost'
									onClick={pm.cancel}
								>
									{t('common:actions.cancel')}
								</Button>
							</div>
						</div>
					</form>
				)}

				{pm.state === 'confirming' && (
					<form onSubmit={pm.handleConfirm} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='code'>
									{t('email.codeLabel')}
								</Label>
								<p className='text-muted-foreground text-sm'>
									<Trans
										t={t}
										i18nKey='email.confirmHint'
										values={{ email: pm.pendingEmail }}
										components={{
											bold: (
												<span className='font-medium' />
											),
										}}
									/>
								</p>
								<Controller
									control={pm.control}
									name='code'
									render={({ field }) => (
										<InputOTP
											maxLength={6}
											value={field.value ?? ''}
											onChange={field.onChange}
										>
											<InputOTPGroup>
												<InputOTPSlot index={0} />
												<InputOTPSlot index={1} />
												<InputOTPSlot index={2} />
												<InputOTPSlot index={3} />
												<InputOTPSlot index={4} />
												<InputOTPSlot index={5} />
											</InputOTPGroup>
										</InputOTP>
									)}
								/>
								{pm.confirmErrors.code && (
									<p className='text-destructive text-sm'>
										{pm.confirmErrors.code.message}
									</p>
								)}
							</div>

							<div className='flex gap-2'>
								<Button
									type='submit'
									disabled={pm.isConfirming}
									className='flex-1'
								>
									{t('common:actions.confirm')}
								</Button>
								<Button
									type='button'
									variant='ghost'
									onClick={pm.cancel}
								>
									{t('common:actions.cancel')}
								</Button>
							</div>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	)
}
