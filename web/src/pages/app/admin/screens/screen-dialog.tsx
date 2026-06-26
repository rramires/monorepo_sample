import { type ReactNode } from 'react'
import { Controller } from 'react-hook-form'

import type { ModuleModel } from '@/api/modules'
import { type ScreenModel } from '@/api/screens'
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

import { useScreenDialogPM } from './use-screen-dialog-pm'

export function ScreenDialog({
	screen,
	modules,
	trigger,
}: {
	screen?: ScreenModel
	modules: ModuleModel[]
	trigger: ReactNode
}) {
	const pm = useScreenDialogPM(screen, modules)

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{pm.editing ? 'Edit screen' : 'New screen'}
					</DialogTitle>
					<DialogDescription>
						A screen is the unit access grants attach to.
					</DialogDescription>
					{pm.locked && (
						<p className='text-muted-foreground text-xs'>
							System screen — module, key and path are locked;
							only name, description and order can change.
						</p>
					)}
				</DialogHeader>

				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label>Module</Label>
							<Controller
								control={pm.control}
								name='module_id'
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}
										disabled={pm.locked}
									>
										<SelectTrigger>
											<SelectValue placeholder='Select a module' />
										</SelectTrigger>
										<SelectContent>
											{pm.moduleOptions.map((m) => (
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
							{pm.errors.module_id && (
								<p className='text-destructive text-sm'>
									{pm.errors.module_id.message}
								</p>
							)}
						</div>

						<Field label='Key' error={pm.errors.key?.message}>
							<Input
								{...pm.register('key')}
								placeholder='gym.dashboard'
								readOnly={pm.locked}
								className={
									pm.locked
										? 'cursor-not-allowed opacity-60'
										: undefined
								}
							/>
						</Field>
						<Field label='Name' error={pm.errors.name?.message}>
							<Input {...pm.register('name')} />
						</Field>
						<Field label='Path'>
							<Input
								{...pm.register('path')}
								placeholder='/'
								readOnly={pm.locked}
								className={
									pm.locked
										? 'cursor-not-allowed opacity-60'
										: undefined
								}
							/>
						</Field>
						<Field label='Description'>
							<Input {...pm.register('description')} />
						</Field>
						<Field label='Order' error={pm.errors.order?.message}>
							<Input
								type='number'
								{...pm.register('order', {
									valueAsNumber: true,
								})}
							/>
						</Field>

						{pm.editing && (
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
										control={pm.control}
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
										control={pm.control}
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
							<Button type='submit' disabled={pm.isSubmitting}>
								{pm.editing ? 'Save changes' : 'Create screen'}
							</Button>
						</DialogFooter>
					</div>
				</form>

				<ConfirmDialog
					{...pm.activeConfirmProps}
					title='Deactivate screen'
					description={`Deactivate "${screen?.name}"? It will be hidden from the add pickers; current assignments keep working until removed.`}
					confirmLabel='Deactivate'
				/>
				<ConfirmDialog
					{...pm.killConfirmProps}
					title='Turn screen off'
					description={`Turn "${screen?.name}" off? It stops working immediately for everyone except admins.`}
					confirmLabel='Turn off'
				/>
			</DialogContent>
		</Dialog>
	)
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
