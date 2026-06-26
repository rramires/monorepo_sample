import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { ModuleModel } from '@/api/modules'
import { createScreen, type ScreenModel, updateScreen } from '@/api/screens'
import { useConfirmDeactivate } from '@/hooks/use-confirm-deactivate'

const screenForm = z.object({
	module_id: z.string().min(1, 'Module is required.'),
	key: z.string().min(1, 'Key is required.'),
	name: z.string().min(1, 'Name is required.'),
	path: z.string(),
	description: z.string(),
	order: z
		.number({ message: 'Order must be a number.' })
		.int('Order must be an integer.'),
	// Lifecycle (disable) + kill switch (On) — only editable, default true.
	is_active: z.boolean(),
	is_enabled: z.boolean(),
})
type ScreenForm = z.infer<typeof screenForm>

function defaults(screen?: ScreenModel): ScreenForm {
	return {
		module_id: screen?.moduleId ?? '',
		key: screen?.key ?? '',
		name: screen?.name ?? '',
		path: screen?.path ?? '',
		description: screen?.description ?? '',
		order: screen?.order ?? 0,
		is_active: screen?.isActive ?? true,
		is_enabled: screen?.isEnabled ?? true,
	}
}

export function useScreenDialogPM(
	screen: ScreenModel | undefined,
	modules: ModuleModel[],
) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const editing = !!screen
	// A system screen's identity (module/key/path) is locked; the backend
	// rejects changing them with a 409, so the inputs are read-only here.
	const locked = editing && !!screen?.isSystem

	// Confirm-on-off for the two lifecycle switches (the house soft-delete pattern).
	const activeConfirm = useConfirmDeactivate()
	const killConfirm = useConfirmDeactivate()

	// Disabled modules can't be targeted by new/edited screens — hide them, but
	// keep the screen's current module so editing never drops a valid selection.
	const moduleOptions = modules.filter(
		(m) => m.isActive || m.id === screen?.moduleId,
	)

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<ScreenForm>({
		resolver: zodResolver(screenForm),
		defaultValues: defaults(screen),
	})

	function onOpenChange(next: boolean) {
		if (next) {
			reset(defaults(screen))
		}
		setOpen(next)
	}

	const save = useMutation({
		mutationFn: (data: ScreenForm) => {
			if (editing) {
				return updateScreen(screen.id, {
					module_id: data.module_id,
					key: data.key,
					name: data.name,
					path: data.path || null,
					description: data.description || null,
					order: data.order,
					is_active: data.is_active,
					is_enabled: data.is_enabled,
				})
			}
			return createScreen({
				module_id: data.module_id,
				key: data.key,
				name: data.name,
				path: data.path || null,
				description: data.description || null,
				order: data.order,
			})
		},
		onSuccess: async () => {
			toast.success(editing ? 'Screen updated.' : 'Screen created.')
			// Lifecycle/kill changes can shift the menu + guards for everyone.
			await queryClient.invalidateQueries({ queryKey: ['screens'] })
			await queryClient.invalidateQueries({
				queryKey: ['me-permissions'],
			})
			setOpen(false)
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not save the screen.',
			)
		},
	})

	// Route a save through the right confirm: deactivating (Active ON→OFF) or
	// killing (On ON→OFF) prompts first; anything else saves straight through.
	function submit(data: ScreenForm) {
		const run = () => save.mutate(data)
		if (editing && screen.isActive && !data.is_active) {
			activeConfirm.guardSave({
				wasActive: true,
				willBeActive: false,
				save: run,
			})
			return
		}
		if (editing && screen.isEnabled && !data.is_enabled) {
			killConfirm.guardSave({
				wasActive: true,
				willBeActive: false,
				save: run,
			})
			return
		}
		run()
	}

	return {
		open,
		onOpenChange,
		editing,
		locked,
		moduleOptions,
		register,
		control,
		errors,
		isSubmitting,
		onSubmit: handleSubmit(submit),
		activeConfirmProps: activeConfirm.dialogProps,
		killConfirmProps: killConfirm.dialogProps,
	}
}
