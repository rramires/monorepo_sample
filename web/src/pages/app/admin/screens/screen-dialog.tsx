import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type ReactNode, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import type { ModuleModel } from '@/api/modules'
import { createScreen, type ScreenModel, updateScreen } from '@/api/screens'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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

				<form onSubmit={handleSubmit(submit)} noValidate>
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
											{moduleOptions.map((m) => (
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

						{editing && (
							<>
								<div className='flex items-center justify-between gap-4 border-t pt-4'>
									<div>
										<Label htmlFor='is_active'>
											Active
										</Label>
										<p className='text-muted-foreground text-xs'>
											Inactive screens are hidden from the
											"add" pickers; existing assignments
											keep working.
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

								<div className='flex items-center justify-between gap-4'>
									<div>
										<Label htmlFor='is_enabled'>On</Label>
										<p className='text-destructive/80 text-xs'>
											Emergency kill switch — turning this
											off blocks the screen for everyone
											(except admins) right away.
										</p>
									</div>
									<Controller
										control={control}
										name='is_enabled'
										render={({ field }) => (
											<Switch
												id='is_enabled'
												checked={field.value}
												onCheckedChange={field.onChange}
											/>
										)}
									/>
								</div>
							</>
						)}

						<DialogFooter>
							<Button type='submit' disabled={isSubmitting}>
								{editing ? 'Save changes' : 'Create screen'}
							</Button>
						</DialogFooter>
					</div>
				</form>

				<ConfirmDialog
					{...activeConfirm.dialogProps}
					title='Deactivate screen'
					description={`Deactivate "${screen?.name}"? It will be hidden from the add pickers; current assignments keep working until removed.`}
					confirmLabel='Deactivate'
				/>
				<ConfirmDialog
					{...killConfirm.dialogProps}
					title='Turn screen off'
					description={`Turn "${screen?.name}" off? It stops working immediately for everyone except admins.`}
					confirmLabel='Turn off'
				/>
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
		is_active: screen?.isActive ?? true,
		is_enabled: screen?.isEnabled ?? true,
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
