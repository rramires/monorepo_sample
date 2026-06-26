import { MailWarning } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp'

import { useVerifyEmailBannerPM } from './use-verify-email-banner-pm'

export function VerifyEmailBanner() {
	const pm = useVerifyEmailBannerPM()
	const { t } = useTranslation('auth')

	if (!pm.visible) {
		return null
	}

	return (
		<>
			<div className='bg-card text-card-foreground flex w-full flex-col items-center gap-2 border-b px-8 py-4'>
				<div className='flex items-center gap-2'>
					<MailWarning className='size-5' />
					<p className='font-medium'>
						{t('verifyEmailBanner.title')}
					</p>
				</div>
				<p className='text-muted-foreground text-sm'>
					{t('verifyEmailBanner.description')}
				</p>
				<Button
					size='sm'
					onClick={pm.handleSendCode}
					disabled={pm.isSending}
				>
					{t('verifyEmailBanner.sendCode')}
				</Button>
			</div>

			<Dialog open={pm.open} onOpenChange={pm.setOpen}>
				<DialogContent className='sm:max-w-sm'>
					<DialogHeader>
						<DialogTitle>
							{t('verifyEmailBanner.dialogTitle')}
						</DialogTitle>
						<DialogDescription>
							{t('verifyEmailBanner.dialogDescription')}
						</DialogDescription>
					</DialogHeader>

					<div className='flex justify-center py-2'>
						<InputOTP
							maxLength={6}
							value={pm.code}
							onChange={pm.setCode}
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
					</div>

					<DialogFooter>
						<Button
							onClick={pm.handleVerify}
							disabled={pm.code.length !== 6 || pm.isVerifying}
							className='w-full'
						>
							{t('verifyEmailBanner.verify')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
