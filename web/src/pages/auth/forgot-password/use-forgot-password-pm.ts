import { zodResolver } from '@hookform/resolvers/zod'
import { makePasswordSchema } from '@root/contracts'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { forgotPassword } from '@/api/forgot-password'
import { resetPassword } from '@/api/reset-password'
import { env } from '@/env'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH

// Shared password shape (@root/contracts) + env policy + localized messages.
// The pattern message stays env-driven (deployment policy text); length messages
// are localized.
const makePassword = (t: TFunction<['auth', 'common']>) =>
	makePasswordSchema({
		min: passwordMin,
		pattern: new RegExp(env.VITE_PASSWORD_PATTERN),
		message: env.VITE_PASSWORD_MESSAGE,
		minMessage: t('common:errors.minChars', { count: passwordMin }),
		maxMessage: t('common:errors.maxChars', { count: 72 }),
	})

const makeRequestForm = (t: TFunction<['auth', 'common']>) =>
	z.object({
		email: z.email(t('common:errors.email')),
	})
type RequestForm = z.infer<ReturnType<typeof makeRequestForm>>

const makeResetForm = (t: TFunction<['auth', 'common']>) =>
	z
		.object({
			code: z.string().length(6, t('common:errors.codeLength')),
			password: makePassword(t),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t('common:errors.passwordsMismatch'),
			path: ['confirmPassword'],
		})
type ResetForm = z.infer<ReturnType<typeof makeResetForm>>

export function useForgotPasswordPM() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation(['auth', 'common'])
	const [step, setStep] = useState<'request' | 'reset'>('request')
	const [email, setEmail] = useState('')

	const {
		register,
		handleSubmit: submitRequest,
		formState: { errors, isSubmitting },
	} = useForm<RequestForm>({
		resolver: useMemo(
			() => zodResolver(makeRequestForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const {
		register: resetRegister,
		control: resetControl,
		handleSubmit: submitReset,
		formState: { errors: resetErrors, isSubmitting: resetIsSubmitting },
	} = useForm<ResetForm>({
		resolver: useMemo(
			() => zodResolver(makeResetForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const { mutateAsync: requestReset } = useMutation({
		mutationFn: forgotPassword,
	})
	const { mutateAsync: confirmReset } = useMutation({
		mutationFn: resetPassword,
	})

	async function onRequest(data: RequestForm) {
		try {
			await requestReset({ email: data.email })
			setEmail(data.email)
			setStep('reset')
			toast.success(t('forgotPassword.toast.requestSuccess'))
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error(t('forgotPassword.toast.tooManyAttempts'))
				return
			}
			toast.error(t('forgotPassword.toast.requestError'))
		}
	}

	async function onReset(data: ResetForm) {
		try {
			await confirmReset({
				email,
				code: data.code,
				newPassword: data.password,
			})
			toast.success(t('forgotPassword.toast.resetSuccess'))
			navigate('/sign-in')
		} catch (err) {
			if (isAxiosError(err) && err.response?.status === 429) {
				toast.error(t('forgotPassword.toast.tooManyAttempts'))
				return
			}
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				t('forgotPassword.toast.resetError')
			toast.error(message)
		}
	}

	return {
		step,
		email,
		backToRequest: () => setStep('request'),
		register,
		errors,
		isSubmitting,
		handleRequest: submitRequest(onRequest),
		resetControl,
		resetRegister,
		resetErrors,
		resetIsSubmitting,
		handleReset: submitReset(onReset),
	}
}
