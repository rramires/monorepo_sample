import { type ReactNode } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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
	const { t } = useTranslation('admin')

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{pm.editing
							? t('screens.dialog.editTitle')
							: t('screens.dialog.newTitle')}
					</DialogTitle>
					<DialogDescription>
						{t('screens.dialog.description')}
					</DialogDescription>
					{pm.locked && (
						<p className='text-muted-foreground text-xs'>
							{t('screens.dialog.lockedHint')}
						</p>
					)}
				</DialogHeader>

				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label>{t('screens.dialog.moduleLabel')}</Label>
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
											<SelectValue
												placeholder={t(
													'screens.dialog.selectModule',
												)}
											/>
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

						<Field
							label={t('screens.dialog.keyLabel')}
							error={pm.errors.key?.message}
						>
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
						<Field
							label={t('screens.dialog.nameLabel')}
							error={pm.errors.name?.message}
						>
							<Input {...pm.register('name')} />
						</Field>
						<Field label={t('screens.dialog.pathLabel')}>
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
						<Field label={t('screens.dialog.descriptionLabel')}>
							<Input {...pm.register('description')} />
						</Field>
						<Field
							label={t('screens.dialog.orderLabel')}
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
							<>
								<div className='flex items-center justify-between gap-4 border-t pt-4'>
									<div>
										<Label htmlFor='is_active'>
											{t('screens.dialog.activeLabel')}
										</Label>
										<p className='text-muted-foreground text-xs'>
											{t('screens.dialog.activeHint')}
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
										<Label htmlFor='is_enabled'>
											{t('screens.dialog.onLabel')}
										</Label>
										<p className='text-destructive/80 text-xs'>
											{t('screens.dialog.onHint')}
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
								{pm.editing
									? t('screens.dialog.save')
									: t('screens.dialog.create')}
							</Button>
						</DialogFooter>
					</div>
				</form>

				<ConfirmDialog
					{...pm.activeConfirmProps}
					title={t('screens.dialog.confirmDeactivate.title')}
					description={t(
						'screens.dialog.confirmDeactivate.description',
						{ name: screen?.name ?? '' },
					)}
					confirmLabel={t(
						'screens.dialog.confirmDeactivate.confirmLabel',
					)}
				/>
				<ConfirmDialog
					{...pm.killConfirmProps}
					title={t('screens.dialog.confirmKill.title')}
					description={t('screens.dialog.confirmKill.description', {
						name: screen?.name ?? '',
					})}
					confirmLabel={t('screens.dialog.confirmKill.confirmLabel')}
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
