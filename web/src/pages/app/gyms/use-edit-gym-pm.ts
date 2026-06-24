import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { Gym } from '@/api/search-gyms'
import { updateGym, type UpdateGymBody } from '@/api/update-gym'
import { useConfirmDeactivate } from '@/hooks/use-confirm-deactivate'

// Mirrors the backend's editable fields — no latitude/longitude (fixed at
// creation). Same phone pattern as the create form. `is_active` is the
// soft-delete toggle (deactivate / reactivate).
const phonePattern = /^\+?[\d\s().-]{7,20}$/

const editGymForm = z.object({
	title: z.string().min(1, 'Title is required.'),
	description: z.string(),
	phone: z
		.string()
		.regex(phonePattern, 'Enter a valid phone number.')
		.or(z.literal('')),
	is_active: z.boolean(),
})
type EditGymForm = z.infer<typeof editGymForm>

export function useEditGymPM(gym: Gym) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const deactivate = useConfirmDeactivate()

	const defaults = (): EditGymForm => ({
		title: gym.title,
		description: gym.description ?? '',
		phone: gym.phone ?? '',
		is_active: gym.is_active,
	})

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<EditGymForm>({
		resolver: zodResolver(editGymForm),
		defaultValues: defaults(),
	})

	function onOpenChange(next: boolean) {
		// Reset to the gym's current values each time the dialog opens.
		if (next) {
			reset(defaults())
		}
		setOpen(next)
	}

	const save = useMutation({
		mutationFn: (body: UpdateGymBody) => updateGym(gym.id, body),
		onSuccess: async (updated) => {
			toast.success(`Gym "${updated.title}" updated.`)
			// Refetch the nearby/search lists so the card reflects the change.
			await queryClient.invalidateQueries({ queryKey: ['gyms'] })
			setOpen(false)
		},
		onError: (err) => {
			const message =
				(isAxiosError(err) && err.response?.data?.message) ||
				'Could not update the gym.'
			toast.error(message)
		},
	})

	function onSubmit(data: EditGymForm) {
		const body: UpdateGymBody = {
			title: data.title,
			description: data.description || null,
			phone: data.phone || null,
			is_active: data.is_active,
		}
		// Confirm-on-deactivate: prompt before saving when Active goes ON -> OFF.
		deactivate.guardSave({
			wasActive: gym.is_active,
			willBeActive: data.is_active,
			save: () => save.mutate(body),
		})
	}

	return {
		open,
		onOpenChange,
		register,
		control,
		errors,
		isSubmitting: save.isPending,
		handleSubmit: handleSubmit(onSubmit),
		// Controlled <ConfirmDialog> props for the confirm-on-deactivate prompt.
		confirmDeactivate: deactivate.dialogProps,
	}
}
