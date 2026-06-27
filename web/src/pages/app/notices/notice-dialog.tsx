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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import { type NoticeInput, useNoticeDialogPM } from './use-notice-dialog-pm'

export function NoticeDialog({
	notice,
	trigger,
}: {
	notice?: NoticeInput
	trigger: ReactNode
}) {
	const pm = useNoticeDialogPM(notice)
	const { t } = useTranslation('notices')

	return (
		<Dialog open={pm.open} onOpenChange={pm.onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{pm.editing
							? t('dialog.editTitle')
							: t('dialog.newTitle')}
					</DialogTitle>
					<DialogDescription>
						{t('dialog.description')}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={pm.onSubmit} noValidate>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label htmlFor='title'>
								{t('dialog.titleLabel')}
							</Label>
							<Input id='title' {...pm.register('title')} />
							{pm.errors.title && (
								<p className='text-destructive text-sm'>
									{pm.errors.title.message}
								</p>
							)}
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='category'>
								{t('dialog.categoryLabel')}
							</Label>
							<Controller
								control={pm.control}
								name='category'
								render={({ field }) => (
									<Select
										value={field.value}
										onValueChange={field.onChange}
									>
										<SelectTrigger id='category'>
											<SelectValue
												placeholder={t(
													'dialog.selectCategory',
												)}
											/>
										</SelectTrigger>
										<SelectContent>
											{pm.categoryOptions.map((o) => (
												<SelectItem
													key={o.value}
													value={o.value}
												>
													{o.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							/>
							{pm.errors.category && (
								<p className='text-destructive text-sm'>
									{pm.errors.category.message}
								</p>
							)}
						</div>
						<DialogFooter>
							<Button type='submit' disabled={pm.isSubmitting}>
								{pm.editing
									? t('dialog.save')
									: t('dialog.create')}
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
