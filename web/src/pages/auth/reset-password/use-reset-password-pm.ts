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

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH

// Shared password shape (@root/contracts) + env policy + localized messages.
// The pattern message stays env-driven; length messages are localized.
const makeResetForm = (t: TFunction<'auth'>) =>
	z
		.object({
			password: makePasswordSchema({
				min: passwordMin,
				pattern: new RegExp(env.VITE_PASSWORD_PATTERN),
				message: env.VITE_PASSWORD_MESSAGE,
				minMessage: t('errors.minChars', { count: passwordMin }),
				maxMessage: t('errors.maxChars', { count: 72 }),
			}),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t('errors.passwordsMismatch'),
			path: ['confirmPassword'],
		})
type ResetForm = z.infer<ReturnType<typeof makeResetForm>>

export function useResetPasswordPM() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation('auth')
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
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				t('resetPassword.toast.error')
			toast.error(message)
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
