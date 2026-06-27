import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { createProfile } from '@/api/profiles'
import { messageFromError } from '@/lib/errors'

const makeProfileForm = (t: TFunction<'admin'>) =>
	z.object({
		key: z.string().min(1, t('fields.keyRequired')),
		name: z.string().min(1, t('fields.nameRequired')),
		description: z.string(),
		is_default: z.boolean(),
	})
type ProfileForm = z.infer<ReturnType<typeof makeProfileForm>>

const EMPTY: ProfileForm = {
	key: '',
	name: '',
	description: '',
	is_default: false,
}

export function useProfileDialogPM() {
	const queryClient = useQueryClient()
	const { t, i18n } = useTranslation('admin')
	const [open, setOpen] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<ProfileForm>({
		resolver: useMemo(
			() => zodResolver(makeProfileForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
		defaultValues: EMPTY,
	})

	function onOpenChange(next: boolean) {
		if (next) {
			reset(EMPTY)
		}
		setOpen(next)
	}

	const save = useMutation({
		mutationFn: (data: ProfileForm) =>
			createProfile({
				key: data.key,
				name: data.name,
				description: data.description || null,
				is_default: data.is_default,
			}),
		onSuccess: async () => {
			toast.success(t('profiles.toast.created'))
			await queryClient.invalidateQueries({ queryKey: ['profiles'] })
			setOpen(false)
		},
		onError: (err) => {
			toast.error(messageFromError(err, t('profiles.toast.createError')))
		},
	})

	return {
		open,
		onOpenChange,
		register,
		control,
		errors,
		isSubmitting,
		onSubmit: handleSubmit((data) => save.mutate(data)),
	}
}
