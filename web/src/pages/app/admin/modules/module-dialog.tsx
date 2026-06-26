import { type ReactNode } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation('admin')

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{pm.editing
							? t('modules.dialog.editTitle')
							: t('modules.dialog.newTitle')}
					</DialogTitle>
					<DialogDescription>
						{t('modules.dialog.description')}
					</DialogDescription>
					{pm.locked && (
						<p className='text-muted-foreground text-xs'>
							{t('modules.dialog.lockedHint')}
						</p>
					)}
				</DialogHeader>

				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<Field
							label={t('modules.dialog.keyLabel')}
							error={pm.errors.key?.message}
						>
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
						<Field
							label={t('modules.dialog.nameLabel')}
							error={pm.errors.name?.message}
						>
							<Input {...pm.register('name')} placeholder='Gym' />
						</Field>
						<Field label={t('modules.dialog.descriptionLabel')}>
							<Input {...pm.register('description')} />
						</Field>
						<Field
							label={t('modules.dialog.orderLabel')}
							error={pm.errors.order?.message}
						>
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
									<Label htmlFor='is_active'>
										{t('modules.dialog.activeLabel')}
									</Label>
									<p className='text-muted-foreground text-xs'>
										{t('modules.dialog.activeHint')}
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
								{pm.editing
									? t('modules.dialog.save')
									: t('modules.dialog.create')}
							</Button>
						</DialogFooter>
					</div>
				</form>

				<ConfirmDialog
					{...pm.confirmProps}
					title={t('modules.dialog.confirmTitle')}
					description={t('modules.dialog.confirmDescription', {
						name: module?.name ?? '',
					})}
					confirmLabel={t('modules.dialog.confirmLabel')}
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
