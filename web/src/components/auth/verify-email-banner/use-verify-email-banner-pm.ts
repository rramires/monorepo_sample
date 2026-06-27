import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { sendVerification } from '@/api/send-verification'
import { verifyEmailByOtp } from '@/api/verify-email'
import { useAuth } from '@/components/auth/auth-hooks'
import { messageFromError } from '@/lib/errors'

export function useVerifyEmailBannerPM() {
	const auth = useAuth()
	const { t } = useTranslation('auth')
	const [open, setOpen] = useState(false)
	const [code, setCode] = useState('')

	const { mutateAsync: send, isPending: isSending } = useMutation({
		mutationFn: sendVerification,
	})
	const { mutateAsync: verify, isPending: isVerifying } = useMutation({
		mutationFn: verifyEmailByOtp,
	})

	async function handleSendCode() {
		try {
			await send()
			toast.success(t('verifyEmailBanner.toast.codeSent'))
			setOpen(true)
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				const retryAfter = err.response.data?.retryAfter
				toast.error(
					retryAfter
						? t('verifyEmailBanner.toast.retryAfter', {
								seconds: retryAfter,
							})
						: t('verifyEmailBanner.toast.retryGeneric'),
				)
				return
			}
			toast.error(t('verifyEmailBanner.toast.sendError'))
		}
	}

	async function handleVerify() {
		try {
			await verify({ code })
			await auth.reloadUser()
			toast.success(t('verifyEmailBanner.toast.verified'))
			setOpen(false)
			setCode('')
		} catch (err) {
			toast.error(
				messageFromError(err, t('verifyEmailBanner.toast.invalidCode')),
			)
		}
	}

	const visible =
		auth.status === 'authed' && auth.user !== null && !auth.user.isVerified

	return {
		visible,
		open,
		setOpen,
		code,
		setCode,
		isSending,
		isVerifying,
		handleSendCode,
		handleVerify,
	}
}
