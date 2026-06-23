import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createModule, type ModuleModel, updateModule } from '@/api/modules'
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

const moduleForm = z.object({
	key: z.string().min(1, 'Key is required.'),
	name: z.string().min(1, 'Name is required.'),
	description: z.string(),
	order: z
		.number({ message: 'Order must be a number.' })
		.int('Order must be an integer.'),
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

	const {
		register,
		handleSubmit,
		reset,
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
			const body = {
				key: data.key,
				name: data.name,
				description: data.description || null,
				order: data.order,
			}
			return editing ? updateModule(module.id, body) : createModule(body)
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
				</DialogHeader>

				<form
					onSubmit={handleSubmit((data) => save.mutate(data))}
					noValidate
				>
					<div className='flex flex-col gap-4'>
						<Field label='Key' error={errors.key?.message}>
							<Input {...register('key')} placeholder='gym' />
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

						<DialogFooter>
							<Button type='submit' disabled={isSubmitting}>
								{editing ? 'Save changes' : 'Create module'}
							</Button>
						</DialogFooter>
					</div>
				</form>
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
