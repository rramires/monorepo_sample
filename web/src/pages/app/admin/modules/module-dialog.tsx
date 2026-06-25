import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type ReactNode, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createModule, type ModuleModel, updateModule } from '@/api/modules'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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

export function ModuleDialog({
	module,
	trigger,
}: {
	module?: ModuleModel
	trigger: ReactNode
}) {
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{editing ? 'Edit module' : 'New module'}
					</DialogTitle>
					<DialogDescription>
						A module groups related screens (e.g. "gym").
					</DialogDescription>
					{locked && (
						<p className='text-muted-foreground text-xs'>
							System module — the key is locked; name, description
							and order can change.
						</p>
					)}
				</DialogHeader>

				<form onSubmit={handleSubmit(submit)} noValidate>
					<div className='flex flex-col gap-4'>
						<Field label='Key' error={errors.key?.message}>
							<Input
								{...register('key')}
								placeholder='gym'
								readOnly={locked}
								className={
									locked
										? 'cursor-not-allowed opacity-60'
										: undefined
								}
							/>
						</Field>
						<Field label='Name' error={errors.name?.message}>
							<Input {...register('name')} placeholder='Gym' />
						</Field>
						<Field label='Description'>
							<Input {...register('description')} />
						</Field>
						<Field label='Order' error={errors.order?.message}>
							<Input
								type='number'
								{...register('order', {
									valueAsNumber: true,
								})}
							/>
						</Field>

						{editing && (
							<div className='flex items-center justify-between gap-4 border-t pt-4'>
								<div>
									<Label htmlFor='is_active'>Active</Label>
									<p className='text-muted-foreground text-xs'>
										Inactive modules are hidden when
										targeting screens; existing screens keep
										working.
									</p>
								</div>
								<Controller
									control={control}
									name='is_active'
									render={({ field }) => (
										<Switch
											id='is_active'
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									)}
								/>
							</div>
						)}

						<DialogFooter>
							<Button type='submit' disabled={isSubmitting}>
								{editing ? 'Save changes' : 'Create module'}
							</Button>
						</DialogFooter>
					</div>
				</form>

				<ConfirmDialog
					{...activeConfirm.dialogProps}
					title='Deactivate module'
					description={`Deactivate "${module?.name}"? It will be hidden when targeting screens; existing screens keep working.`}
					confirmLabel='Deactivate'
				/>
			</DialogContent>
		</Dialog>
	)
}

function defaults(module?: ModuleModel): ModuleForm {
	return {
		key: module?.key ?? '',
		name: module?.name ?? '',
		description: module?.description ?? '',
		order: module?.order ?? 0,
		is_active: module?.isActive ?? true,
	}
}

function Field({
	label,
	error,
	children,
}: {
	label: string
	error?: string
	children: ReactNode
}) {
	return (
		<div className='grid gap-2'>
			<Label>{label}</Label>
			{children}
			{error && <p className='text-destructive text-sm'>{error}</p>}
		</div>
	)
}
