import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'

import { createGym } from '@/api/create-gym'
import { messageFromError } from '@/lib/errors'
import { getCurrentPosition } from '@/lib/geolocation'

// Mirrors the backend: title required; description/phone optional; phone must
// match the API's loose phone pattern; coordinates are required, in range.
const phonePattern = /^\+?[\d\s().-]{7,20}$/

function coordinate(requiredMsg: string, invalidMsg: string, max: number) {
	return z
		.string()
		.min(1, requiredMsg)
		.refine((value) => {
			const parsed = Number(value)
			return !Number.isNaN(parsed) && parsed >= -max && parsed <= max
		}, invalidMsg)
}

const makeNewGymForm = (t: TFunction<'gyms'>) =>
	z.object({
		title: z.string().min(1, t('errors.titleRequired')),
		description: z.string(),
		phone: z
			.string()
			.regex(phonePattern, t('errors.phone'))
			.or(z.literal('')),
		latitude: coordinate(
			t('errors.latitudeRequired'),
			t('errors.latitudeInvalid'),
			90,
		),
		longitude: coordinate(
			t('errors.longitudeRequired'),
			t('errors.longitudeInvalid'),
			180,
		),
	})
type NewGymForm = z.infer<ReturnType<typeof makeNewGymForm>>

export function useNewGymPM() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation('gyms')
	const [locating, setLocating] = useState(false)

	const {
		register,
		handleSubmit,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<NewGymForm>({
		resolver: useMemo(
			() => zodResolver(makeNewGymForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
		defaultValues: {
			title: '',
			description: '',
			phone: '',
			latitude: '',
			longitude: '',
		},
	})

	const { mutateAsync: submitGym } = useMutation({ mutationFn: createGym })

	async function handleUseMyLocation() {
		setLocating(true)
		try {
			const position = await getCurrentPosition()
			setValue('latitude', String(position.latitude))
			setValue('longitude', String(position.longitude))
		} catch {
			toast.error(t('toast.locationError'))
		} finally {
			setLocating(false)
		}
	}

	async function onSubmit(data: NewGymForm) {
		try {
			const gym = await submitGym({
				title: data.title,
				description: data.description || null,
				phone: data.phone || null,
				latitude: Number(data.latitude),
				longitude: Number(data.longitude),
			})
			toast.success(t('toast.created', { title: gym.title }))
			navigate('/gyms')
		} catch (err) {
			toast.error(messageFromError(err, t('toast.createError')))
		}
	}

	return {
		register,
		errors,
		isSubmitting,
		locating,
		handleUseMyLocation,
		handleSubmit: handleSubmit(onSubmit),
	}
}
