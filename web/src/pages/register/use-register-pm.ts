import { zodResolver } from '@hookform/resolvers/zod'
import { makePasswordSchema } from '@root/contracts'
import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { registerAccount } from '@/api/register'
import { env } from '@/env'
import { messageFromError } from '@/lib/errors'

const passwordMin = env.VITE_PASSWORD_MIN_LENGTH

// Shared password shape (@root/contracts) with this app's env policy + localized
// UX messages. The regex *pattern* comes from VITE_PASSWORD_*; its failure
// message is localized (common:errors.passwordPattern). Length messages too.
const makePassword = (t: TFunction<['auth', 'common']>) =>
	makePasswordSchema({
		min: passwordMin,
		pattern: new RegExp(env.VITE_PASSWORD_PATTERN),
		message: t('common:errors.passwordPattern'),
		minMessage: t('common:errors.minChars', { count: passwordMin }),
		maxMessage: t('common:errors.maxChars', { count: 72 }),
	})

const makeRegisterForm = (t: TFunction<['auth', 'common']>) =>
	z
		.object({
			username: z
				.string()
				.min(3, t('common:errors.minChars', { count: 3 }))
				.max(30, t('common:errors.maxChars', { count: 30 }))
				.regex(/^[a-zA-Z0-9_]+$/, t('common:errors.usernamePattern'))
				.transform((s) => s.toLowerCase()),
			email: z.email(t('common:errors.email')),
			password: makePassword(t),
			confirmPassword: z.string(),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t('common:errors.passwordsMismatch'),
			path: ['confirmPassword'],
		})

type RegisterForm = z.infer<ReturnType<typeof makeRegisterForm>>

export function useRegisterPM() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation(['auth', 'common'])

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterForm>({
		resolver: useMemo(
			() => zodResolver(makeRegisterForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const { mutateAsync: createAccount } = useMutation({
		mutationFn: registerAccount,
	})

	async function onSubmit({ username, email, password }: RegisterForm) {
		try {
			await createAccount({ username, email, password })
			toast.success(t('register.toast.success'))
			navigate('/sign-in')
		} catch (err) {
			toast.error(messageFromError(err, t('register.toast.error')))
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
