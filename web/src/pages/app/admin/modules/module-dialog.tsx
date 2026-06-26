import { type ReactNode } from 'react'
import { Controller } from 'react-hook-form'

import { type ModuleModel } from '@/api/modules'
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

import { useModuleDialogPM } from './use-module-dialog-pm'

export function ModuleDialog({
	module,
	trigger,
}: {
	module?: ModuleModel
	trigger: ReactNode
}) {
	const pm = useModuleDialogPM(module)

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{pm.editing ? 'Edit module' : 'New module'}
					</DialogTitle>
					<DialogDescription>
						A module groups related screens (e.g. "gym").
					</DialogDescription>
					{pm.locked && (
						<p className='text-muted-foreground text-xs'>
							System module — the key is locked; name, description
							and order can change.
						</p>
					)}
				</DialogHeader>

				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<Field label='Key' error={pm.errors.key?.message}>
							<Input
								{...pm.register('key')}
								placeholder='gym'
								readOnly={pm.locked}
								className={
									pm.locked
										? 'cursor-not-allowed opacity-60'
										: undefined
								}
							/>
						</Field>
						<Field label='Name' error={pm.errors.name?.message}>
							<Input {...pm.register('name')} placeholder='Gym' />
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
						)}

						<DialogFooter>
							<Button type='submit' disabled={pm.isSubmitting}>
								{pm.editing ? 'Save changes' : 'Create module'}
							</Button>
						</DialogFooter>
					</div>
				</form>

				<ConfirmDialog
					{...pm.confirmProps}
					title='Deactivate module'
					description={`Deactivate "${module?.name}"? It will be hidden when targeting screens; existing screens keep working.`}
					confirmLabel='Deactivate'
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
