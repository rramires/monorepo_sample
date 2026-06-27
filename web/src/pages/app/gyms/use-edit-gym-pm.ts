import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import type { Gym } from '@/api/search-gyms'
import { updateGym, type UpdateGymBody } from '@/api/update-gym'
import { useConfirmDeactivate } from '@/hooks/use-confirm-deactivate'
import { messageFromError } from '@/lib/errors'

// Mirrors the backend's editable fields — no latitude/longitude (fixed at
// creation). Same phone pattern as the create form. `is_active` is the
// soft-delete toggle (deactivate / reactivate).
const phonePattern = /^\+?[\d\s().-]{7,20}$/

const makeEditGymForm = (t: TFunction<'gyms'>) =>
	z.object({
		title: z.string().min(1, t('errors.titleRequired')),
		description: z.string(),
		phone: z
			.string()
			.regex(phonePattern, t('errors.phone'))
			.or(z.literal('')),
		is_active: z.boolean(),
	})
type EditGymForm = z.infer<ReturnType<typeof makeEditGymForm>>

export function useEditGymPM(gym: Gym) {
	const queryClient = useQueryClient()
	const { t, i18n } = useTranslation('gyms')
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
		resolver: useMemo(
			() => zodResolver(makeEditGymForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
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
			toast.success(t('toast.updated', { title: updated.title }))
			// Refetch the nearby/search lists so the card reflects the change.
			await queryClient.invalidateQueries({ queryKey: ['gyms'] })
			setOpen(false)
		},
		onError: (err) => {
			toast.error(messageFromError(err, t('toast.updateError')))
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
