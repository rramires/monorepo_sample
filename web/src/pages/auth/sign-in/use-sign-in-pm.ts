import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { signIn } from '@/api/sign-in'
import { useAuth } from '@/components/auth/auth-hooks'

const makeSignInForm = (t: TFunction<'auth'>) =>
	z.object({
		identifier: z.string().min(1, t('signIn.errors.identifier')),
		password: z
			.string()
			.min(1, t('signIn.errors.passwordRequired'))
			.max(72, t('errors.maxChars', { count: 72 })),
	})

type SignInForm = z.infer<ReturnType<typeof makeSignInForm>>

export function useSignInPM() {
	const navigate = useNavigate()
	const auth = useAuth()
	const { t, i18n } = useTranslation('auth')

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<SignInForm>({
		// Rebuild the resolver when the language changes so messages localize.
		resolver: useMemo(
			() => zodResolver(makeSignInForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
	})

	const { mutateAsync: authenticate } = useMutation({
		mutationFn: signIn,
	})

	async function onSubmit(data: SignInForm) {
		try {
			const { token } = await authenticate(data)
			await auth.signIn(token)
			toast.success(t('signIn.toast.success'))
			navigate('/')
		} catch (err) {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				t('signIn.toast.error')
			toast.error(message)
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		handleSubmit: handleSubmit(onSubmit),
	}
}
