import { type ReactNode } from 'react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

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

import { useProfileDialogPM } from './use-profile-dialog-pm'

export function ProfileDialog({ trigger }: { trigger: ReactNode }) {
	const pm = useProfileDialogPM()
	const { t } = useTranslation('admin')

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{t('profiles.dialog.title')}</DialogTitle>
					<DialogDescription>
						{t('profiles.dialog.description')}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label>{t('profiles.dialog.keyLabel')}</Label>
							<Input
								{...pm.register('key')}
								placeholder='gym-member'
							/>
							{pm.errors.key && (
								<p className='text-destructive text-sm'>
									{pm.errors.key.message}
								</p>
							)}
						</div>
						<div className='grid gap-2'>
							<Label>{t('profiles.dialog.nameLabel')}</Label>
							<Input {...pm.register('name')} />
							{pm.errors.name && (
								<p className='text-destructive text-sm'>
									{pm.errors.name.message}
								</p>
							)}
						</div>
						<div className='grid gap-2'>
							<Label>
								{t('profiles.dialog.descriptionLabel')}
							</Label>
							<Input {...pm.register('description')} />
						</div>
						<div className='flex items-center justify-between'>
							<div>
								<Label>
									{t('profiles.dialog.defaultLabel')}
								</Label>
								<p className='text-muted-foreground text-xs'>
									{t('profiles.dialog.defaultHint')}
								</p>
							</div>
							<Controller
								control={pm.control}
								name='is_default'
								render={({ field }) => (
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								)}
							/>
						</div>

						<DialogFooter>
							<Button type='submit' disabled={pm.isSubmitting}>
								{t('profiles.dialog.create')}
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
