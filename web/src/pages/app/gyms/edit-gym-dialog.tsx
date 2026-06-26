import { Pencil } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import type { Gym } from '@/api/search-gyms'
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

import { useEditGymPM } from './use-edit-gym-pm'

export function EditGymDialog({ gym }: { gym: Gym }) {
	const pm = useEditGymPM(gym)
	const { t } = useTranslation(['gyms', 'common'])

	return (
		<>
			<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
				<DialogTrigger asChild>
					<Button variant='outline' className='w-full'>
						<Pencil className='size-4' />
						{t('common:actions.edit')}
					</Button>
				</DialogTrigger>

				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>{t('gyms:edit.title')}</DialogTitle>
						<DialogDescription>
							{t('gyms:edit.description')}
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={pm.handleSubmit} noValidate>
						<div className='flex flex-col gap-6'>
							<div className='grid gap-2'>
								<Label htmlFor='edit-title'>
									{t('gyms:edit.titleLabel')}
								</Label>
								<Input
									id='edit-title'
									{...pm.register('title')}
								/>
								{pm.errors.title && (
									<p className='text-destructive text-sm'>
										{pm.errors.title.message}
									</p>
								)}
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='edit-description'>
									{t('gyms:edit.descriptionLabel')}
								</Label>
								<Input
									id='edit-description'
									{...pm.register('description')}
								/>
							</div>

							<div className='grid gap-2'>
								<Label htmlFor='edit-phone'>
									{t('gyms:edit.phoneLabel')}
								</Label>
								<Input
									id='edit-phone'
									{...pm.register('phone')}
								/>
								{pm.errors.phone && (
									<p className='text-destructive text-sm'>
										{pm.errors.phone.message}
									</p>
								)}
							</div>

							<div className='flex items-center justify-between'>
								<div>
									<Label htmlFor='edit-active'>
										{t('gyms:edit.activeLabel')}
									</Label>
									<p className='text-muted-foreground text-sm'>
										{t('gyms:edit.activeHint')}
									</p>
								</div>
								<Controller
									control={pm.control}
									name='is_active'
									render={({ field }) => (
										<Switch
											id='edit-active'
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									)}
								/>
							</div>

							<DialogFooter>
								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									{t('gyms:edit.save')}
								</Button>
							</DialogFooter>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			<ConfirmDialog
				{...pm.confirmDeactivate}
				title={t('gyms:edit.confirmTitle')}
				description={t('gyms:edit.confirmDescription', {
					title: gym.title,
				})}
				confirmLabel={t('gyms:edit.confirmLabel')}
			/>
		</>
	)
}
