import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { updateProfile } from '@/api/update-profile'
import { useAuth } from '@/components/auth/auth-hooks'
import { messageFromError } from '@/lib/errors'

// Mirrors the backend: 3-30 chars, letters/numbers/underscore only.
const usernamePattern = /^[a-zA-Z0-9_]+$/

const makeProfileForm = (t: TFunction<['account', 'common']>) =>
	z.object({
		username: z
			.string()
			.min(3, t('common:errors.minChars', { count: 3 }))
			.max(30, t('common:errors.maxChars', { count: 30 }))
			.regex(usernamePattern, t('common:errors.usernamePattern')),
	})
type ProfileForm = z.infer<ReturnType<typeof makeProfileForm>>

export function useProfileCardPM() {
	const auth = useAuth()
	const { t, i18n } = useTranslation(['account', 'common'])

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isDirty },
	} = useForm<ProfileForm>({
		resolver: useMemo(
			() => zodResolver(makeProfileForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
		defaultValues: { username: auth.user?.username ?? '' },
	})

	const { mutateAsync: saveProfile } = useMutation({
		mutationFn: updateProfile,
	})

	async function onSubmit(data: ProfileForm) {
		try {
			await saveProfile({ username: data.username })
			// Refetch the profile so the sidebar (and the rest of the app) pick
			// up the new username.
			await auth.reloadUser()
			toast.success(t('profile.toast.success'))
		} catch (err) {
			toast.error(messageFromError(err, t('profile.toast.error')))
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		isDirty,
		handleSubmit: handleSubmit(onSubmit),
	}
}
