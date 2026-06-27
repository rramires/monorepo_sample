import { zodResolver } from '@hookform/resolvers/zod'
import { makePasswordSchema } from '@root/contracts'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { resetPassword } from '@/api/reset-password'
import { env } from '@/env'
import { messageFromError } from '@/lib/errors'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH

// Shared password shape (@root/contracts) + env policy + localized messages.
// The pattern's failure message is localized (common:errors.passwordPattern);
// length messages are localized too.
const makeResetForm = (t: TFunction<['auth', 'common']>) =>
	z
		.object({
			password: makePasswordSchema({
				min: passwordMin,
				pattern: new RegExp(env.VITE_PASSWORD_PATTERN),
				message: t('common:errors.passwordPattern'),
				minMessage: t('common:errors.minChars', { count: passwordMin }),
				maxMessage: t('common:errors.maxChars', { count: 72 }),
			}),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t('common:errors.passwordsMismatch'),
			path: ['confirmPassword'],
		})
type ResetForm = z.infer<ReturnType<typeof makeResetForm>>

export function useResetPasswordPM() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation(['auth', 'common'])
	const [searchParams] = useSearchParams()
	const token = searchParams.get('token')

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<ResetForm>({
		resolver: useMemo(
			() => zodResolver(makeResetForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const { mutateAsync: confirmReset } = useMutation({
		mutationFn: resetPassword,
	})

	async function onSubmit(data: ResetForm) {
		if (!token) {
			return
		}

		try {
			await confirmReset({ token, newPassword: data.password })
			toast.success(t('resetPassword.toast.success'))
			navigate('/sign-in')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error(t('resetPassword.toast.tooManyAttempts'))
				return
			}
			toast.error(messageFromError(err, t('resetPassword.toast.error')))
		}
	}

	return {
		hasToken: Boolean(token),
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
