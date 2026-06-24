import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type ReactNode, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { ModuleModel } from '@/api/modules'
import { createScreen, type ScreenModel, updateScreen } from '@/api/screens'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

const screenForm = z.object({
	module_id: z.string().min(1, 'Module is required.'),
	key: z.string().min(1, 'Key is required.'),
	name: z.string().min(1, 'Name is required.'),
	path: z.string(),
	description: z.string(),
	order: z
		.number({ message: 'Order must be a number.' })
		.int('Order must be an integer.'),
})
type ScreenForm = z.infer<typeof screenForm>

export function ScreenDialog({
	screen,
	modules,
	trigger,
}: {
	screen?: ScreenModel
	modules: ModuleModel[]
	trigger: ReactNode
}) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const editing = !!screen
	// A system screen's identity (module/key/path) is locked; the backend
	// rejects changing them with a 409, so the inputs are read-only here.
	const locked = editing && !!screen?.isSystem

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
			const body = {
				module_id: data.module_id,
				key: data.key,
				name: data.name,
				path: data.path || null,
				description: data.description || null,
				order: data.order,
			}
			return editing ? updateScreen(screen.id, body) : createScreen(body)
		},
		onSuccess: async () => {
			toast.success(editing ? 'Screen updated.' : 'Screen created.')
			await queryClient.invalidateQueries({ queryKey: ['screens'] })
			setOpen(false)
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not save the screen.',
			)
		},
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{editing ? 'Edit screen' : 'New screen'}
					</DialogTitle>
					<DialogDescription>
						A screen is the unit access grants attach to.
					</DialogDescription>
					{locked && (
						<p className='text-muted-foreground text-xs'>
							System screen — module, key and path are locked;
							only name, description and order can change.
						</p>
					)}
				</DialogHeader>

				<form
					onSubmit={handleSubmit((data) => save.mutate(data))}
					noValidate
				>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label>Module</Label>
							<Controller
								control={control}
								name='module_id'
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={locked}
									>
										<SelectTrigger>
											<SelectValue placeholder='Select a module' />
										</SelectTrigger>
										<SelectContent>
											{modules.map((m) => (
												<SelectItem
													key={m.id}
													value={m.id}
												>
													{m.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{errors.module_id && (
								<p className='text-destructive text-sm'>
									{errors.module_id.message}
								</p>
							)}
						</div>

						<Field label='Key' error={errors.key?.message}>
							<Input
								{...register('key')}
								placeholder='gym.dashboard'
								readOnly={locked}
								className={
									locked
										? 'cursor-not-allowed opacity-60'
										: undefined
								}
							/>
						</Field>
						<Field label='Name' error={errors.name?.message}>
							<Input {...register('name')} />
						</Field>
						<Field label='Path'>
							<Input
								{...register('path')}
								placeholder='/'
								readOnly={locked}
								className={
									locked
										? 'cursor-not-allowed opacity-60'
										: undefined
								}
							/>
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
								{editing ? 'Save changes' : 'Create screen'}
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

function defaults(screen?: ScreenModel): ScreenForm {
	return {
		module_id: screen?.moduleId ?? '',
		key: screen?.key ?? '',
		name: screen?.name ?? '',
		path: screen?.path ?? '',
		description: screen?.description ?? '',
		order: screen?.order ?? 0,
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
