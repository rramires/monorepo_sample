import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { confirmEmailChangeByOtp } from '@/api/confirm-email-change'
import { requestEmailChange } from '@/api/request-email-change'
import { useAuth } from '@/components/auth/auth-hooks'
import { messageFromError } from '@/lib/errors'

const makeRequestForm = (t: TFunction<['account', 'common']>) =>
	z.object({ email: z.email(t('common:errors.email')) })
type RequestForm = z.infer<ReturnType<typeof makeRequestForm>>

const makeConfirmForm = (t: TFunction<['account', 'common']>) =>
	z.object({
		code: z.string().length(6, t('common:errors.codeLength')),
	})
type ConfirmForm = z.infer<ReturnType<typeof makeConfirmForm>>

// idle → editing (type the new email) → confirming (enter the code / click the
// link). Two doors: the OTP here, or the link from the email (landing page).
export type EmailCardState = 'idle' | 'editing' | 'confirming'

export function useEmailCardPM() {
	const auth = useAuth()
	const { t, i18n } = useTranslation(['account', 'common'])
	const [state, setState] = useState<EmailCardState>('idle')
	const [pendingEmail, setPendingEmail] = useState('')

	const {
		register,
		handleSubmit: submitRequest,
		reset: resetRequest,
		formState: { errors, isSubmitting },
	} = useForm<RequestForm>({
		resolver: useMemo(
			() => zodResolver(makeRequestForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const {
		control,
		handleSubmit: submitConfirm,
		reset: resetConfirm,
		formState: { errors: confirmErrors, isSubmitting: isConfirming },
	} = useForm<ConfirmForm>({
		resolver: useMemo(
			() => zodResolver(makeConfirmForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const { mutateAsync: requestChange } = useMutation({
		mutationFn: requestEmailChange,
	})
	const { mutateAsync: confirmChange } = useMutation({
		mutationFn: confirmEmailChangeByOtp,
	})

	function startEditing() {
		resetRequest({ email: '' })
		setState('editing')
	}

	function cancel() {
		resetRequest({ email: '' })
		resetConfirm({ code: '' })
		setState('idle')
	}

	async function onRequest(data: RequestForm) {
		try {
			await requestChange({ email: data.email })
			setPendingEmail(data.email)
			resetConfirm({ code: '' })
			setState('confirming')
			toast.success(t('email.toast.codeSent'))
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error(t('email.toast.rateLimited'))
				return
			}
			toast.error(messageFromError(err, t('email.toast.requestError')))
		}
	}

	async function onConfirm(data: ConfirmForm) {
		try {
			await confirmChange({ code: data.code })
			toast.success(t('email.toast.updated'))
			// Confirming proves the new address → refetch so is_verified is fresh.
			await auth.reloadUser()
			cancel()
		} catch (err) {
			toast.error(messageFromError(err, t('email.toast.invalidCode')))
		}
	}

	return {
		state,
		pendingEmail,
		register,
		errors,
		isSubmitting,
		handleRequest: submitRequest(onRequest),
		control,
		confirmErrors,
		isConfirming,
		handleConfirm: submitConfirm(onConfirm),
		startEditing,
		cancel,
	}
}
