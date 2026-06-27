import { zodResolver } from '@hookform/resolvers/zod'
import { type NoticeCategory } from '@root/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TFunction } from 'i18next'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'

import { createNotice, updateNotice } from '@/api/notices'
import { messageFromError } from '@/lib/errors'

export interface NoticeInput {
	id: string
	title: string
	category: NoticeCategory
}

const CATEGORIES: NoticeCategory[] = ['info', 'warning', 'urgent']

const makeNoticeForm = (t: TFunction<'notices'>) =>
	z.object({
		title: z.string().min(1, t('fields.titleRequired')),
		category: z.enum(CATEGORIES, { message: t('fields.categoryRequired') }),
	})
type NoticeForm = z.infer<ReturnType<typeof makeNoticeForm>>

function defaults(notice?: NoticeInput): NoticeForm {
	return { title: notice?.title ?? '', category: notice?.category ?? 'info' }
}

export function useNoticeDialogPM(notice?: NoticeInput) {
	const queryClient = useQueryClient()
	const { t, i18n } = useTranslation('notices')
	const [open, setOpen] = useState(false)
	const editing = !!notice

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<NoticeForm>({
		resolver: useMemo(
			() => zodResolver(makeNoticeForm(t)),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[i18n.language],
		),
		defaultValues: defaults(notice),
	})

	function onOpenChange(next: boolean) {
		if (next) {
			reset(defaults(notice))
		} // re-semeia → cold-load do Select na edição
		setOpen(next)
	}

	const categoryOptions = CATEGORIES.map((value) => ({
		value,
		label: t(`categories.${value}`),
	}))

	const save = useMutation({
		mutationFn: (data: NoticeForm) =>
			editing
				? updateNotice(notice.id, {
						title: data.title,
						category: data.category,
					})
				: createNotice({ title: data.title, category: data.category }),
		onSuccess: async () => {
			toast.success(editing ? t('toast.updated') : t('toast.created'))
			await queryClient.invalidateQueries({ queryKey: ['notices'] })
			setOpen(false)
		},
		onError: (err) =>
			toast.error(messageFromError(err, t('toast.saveError'))),
	})

	return {
		open,
		onOpenChange,
		editing,
		register,
		control,
		errors,
		isSubmitting,
		categoryOptions,
		onSubmit: handleSubmit((d) => save.mutate(d)),
	}
}
