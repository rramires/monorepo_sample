import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createProfile } from '@/api/profiles'

const profileForm = z.object({
	key: z.string().min(1, 'Key is required.'),
	name: z.string().min(1, 'Name is required.'),
	description: z.string(),
	is_default: z.boolean(),
})
type ProfileForm = z.infer<typeof profileForm>

const EMPTY: ProfileForm = {
	key: '',
	name: '',
	description: '',
	is_default: false,
}

export function useProfileDialogPM() {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<ProfileForm>({
		resolver: zodResolver(profileForm),
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
			toast.success('Profile created.')
			await queryClient.invalidateQueries({ queryKey: ['profiles'] })
			setOpen(false)
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not create the profile.',
			)
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
