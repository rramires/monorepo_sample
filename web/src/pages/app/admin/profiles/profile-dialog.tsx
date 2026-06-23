import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { type ReactNode, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { createProfile } from '@/api/profiles'
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

const profileForm = z.object({
	key: z.string().min(1, 'Key is required.'),
	name: z.string().min(1, 'Name is required.'),
	description: z.string(),
	is_default: z.boolean(),
})
type ProfileForm = z.infer<typeof profileForm>

export function ProfileDialog({ trigger }: { trigger: ReactNode }) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors, isSubmitting },
	} = useForm<ProfileForm>({
		resolver: zodResolver(profileForm),
		defaultValues: {
			key: '',
			name: '',
			description: '',
			is_default: false,
		},
	})

	function onOpenChange(next: boolean) {
		if (next) {
			reset({ key: '', name: '', description: '', is_default: false })
		}
		setOpen(next)
	}

	const save = useMutation({
		mutationFn: (data: ProfileForm) =>
			createProfile({
				key: data.key,
				name: data.name,
				description: data.description || null,
				is_default: data.is_default,
			}),
		onSuccess: async () => {
			toast.success('Profile created.')
			await queryClient.invalidateQueries({ queryKey: ['profiles'] })
			setOpen(false)
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not create the profile.',
			)
		},
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>New profile</DialogTitle>
					<DialogDescription>
						A profile bundles screen grants you assign to users.
						Configure its grants after creating it.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit((data) => save.mutate(data))}
					noValidate
				>
					<div className='flex flex-col gap-4'>
						<div className='grid gap-2'>
							<Label>Key</Label>
							<Input
								{...register('key')}
								placeholder='gym-member'
							/>
							{errors.key && (
								<p className='text-destructive text-sm'>
									{errors.key.message}
								</p>
							)}
						</div>
						<div className='grid gap-2'>
							<Label>Name</Label>
							<Input {...register('name')} />
							{errors.name && (
								<p className='text-destructive text-sm'>
									{errors.name.message}
								</p>
							)}
						</div>
						<div className='grid gap-2'>
							<Label>Description</Label>
							<Input {...register('description')} />
						</div>
						<div className='flex items-center justify-between'>
							<div>
								<Label>Default profile</Label>
								<p className='text-muted-foreground text-xs'>
									Auto-attached to new registrations.
								</p>
							</div>
							<Controller
								control={control}
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
							<Button type='submit' disabled={isSubmitting}>
								Create profile
							</Button>
						</DialogFooter>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
