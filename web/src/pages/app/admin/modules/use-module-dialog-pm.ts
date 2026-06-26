import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createModule, type ModuleModel, updateModule } from '@/api/modules'
import { useConfirmDeactivate } from '@/hooks/use-confirm-deactivate'

const moduleForm = z.object({
	key: z.string().min(1, 'Key is required.'),
	name: z.string().min(1, 'Name is required.'),
	description: z.string(),
	order: z
		.number({ message: 'Order must be a number.' })
		.int('Order must be an integer.'),
	// Lifecycle (disable) — editable only, default true.
	is_active: z.boolean(),
})
type ModuleForm = z.infer<typeof moduleForm>

function defaults(module?: ModuleModel): ModuleForm {
	return {
		key: module?.key ?? '',
		name: module?.name ?? '',
		description: module?.description ?? '',
		order: module?.order ?? 0,
		is_active: module?.isActive ?? true,
	}
}

export function useModuleDialogPM(module?: ModuleModel) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const editing = !!module
	// A system module's key is locked; the backend rejects a rename with 409.
	const locked = editing && !!module?.isSystem

	const activeConfirm = useConfirmDeactivate()

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<ModuleForm>({
		resolver: zodResolver(moduleForm),
		defaultValues: defaults(module),
	})

	function onOpenChange(next: boolean) {
		if (next) {
			reset(defaults(module))
		}
		setOpen(next)
	}

	const save = useMutation({
		mutationFn: (data: ModuleForm) => {
			if (editing) {
				return updateModule(module.id, {
					key: data.key,
					name: data.name,
					description: data.description || null,
					order: data.order,
					is_active: data.is_active,
				})
			}
			return createModule({
				key: data.key,
				name: data.name,
				description: data.description || null,
				order: data.order,
			})
		},
		onSuccess: async () => {
			toast.success(editing ? 'Module updated.' : 'Module created.')
			await queryClient.invalidateQueries({ queryKey: ['modules'] })
			setOpen(false)
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not save the module.',
			)
		},
	})

	// Deactivating (Active ON→OFF) confirms first; anything else saves through.
	function submit(data: ModuleForm) {
		activeConfirm.guardSave({
			wasActive: module?.isActive ?? true,
			willBeActive: data.is_active,
			save: () => save.mutate(data),
		})
	}

	return {
		open,
		onOpenChange,
		editing,
		locked,
		register,
		control,
		errors,
		isSubmitting,
		onSubmit: handleSubmit(submit),
		confirmProps: activeConfirm.dialogProps,
	}
}
