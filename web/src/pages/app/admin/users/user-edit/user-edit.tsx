import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageTitle } from '@/components/title/page-title'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
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

import { useUserEditPM } from './use-user-edit-pm'
import { UserProfilesCard } from './user-profiles-card'

export function UserEdit() {
	const pm = useUserEditPM()
	const { t } = useTranslation(['admin', 'common'])

	return (
		<>
			<PageTitle title={t('users.edit.pageTitle')} />

			<div className='flex flex-1 flex-col items-center gap-6 p-8'>
				<Card className='w-full max-w-3xl'>
					{pm.isLoading && (
						<CardHeader>
							<CardTitle>{t('common:states.loading')}</CardTitle>
						</CardHeader>
					)}

					{pm.isError && (
						<>
							<CardHeader>
								<CardTitle>
									{t('users.edit.notFoundTitle')}
								</CardTitle>
								<CardDescription>
									{t('users.edit.notFoundDescription')}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button asChild variant='outline'>
									<Link to='/admin/users'>
										{t('users.edit.backToUsers')}
									</Link>
								</Button>
							</CardContent>
						</>
					)}

					{!pm.isLoading && !pm.isError && pm.user && (
						<>
							<CardHeader>
								<CardTitle>{t('users.edit.title')}</CardTitle>
								<CardDescription>
									{t('users.edit.description', {
										username: pm.user.username,
									})}
								</CardDescription>
							</CardHeader>

							<CardContent>
								<form onSubmit={pm.handleSubmit} noValidate>
									<div className='flex flex-col gap-6'>
										<div className='grid gap-2'>
											<Label htmlFor='username'>
												{t('users.edit.usernameLabel')}
											</Label>
											<Input
												id='username'
												autoFocus
												{...pm.register('username')}
											/>
											{pm.errors.username && (
												<p className='text-destructive text-sm'>
													{pm.errors.username.message}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='email'>
												{t('users.edit.emailLabel')}
											</Label>
											<Input
												id='email'
												type='email'
												{...pm.register('email')}
											/>
											{pm.errors.email && (
												<p className='text-destructive text-sm'>
													{pm.errors.email.message}
												</p>
											)}
											{pm.emailChanged && (
												<p className='text-muted-foreground text-sm'>
													{t(
														'users.edit.emailUnverifyHint',
													)}
												</p>
											)}
										</div>

										<div className='grid gap-2'>
											<Label htmlFor='role'>
												{t('users.edit.roleLabel')}
											</Label>
											{pm.isSelf ? (
												// Your own role can't change — show
												// it read-only as a badge.
												<Badge
													variant={
														pm.user.role === 'ADMIN'
															? 'default'
															: 'secondary'
													}
													className='w-fit'
												>
													{pm.user.role === 'ADMIN'
														? t(
																'common:roles.admin',
															)
														: t(
																'common:roles.member',
															)}
												</Badge>
											) : (
												<Controller
													control={pm.control}
													name='role'
													render={({ field }) => (
														<Select
															// key remounts the Select per user; defaultValue seeds it
															// uncontrolled. A controlled value goes stale during the
															// cross-user navigation transient (useForm persists) and
															// Radix won't re-show it without reopening.
															/* key={pm.user?.id} */
															defaultValue={
																field.value
															}
															onValueChange={
																field.onChange
															}
														>
															<SelectTrigger id='role'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value='USER'>
																	{t(
																		'common:roles.member',
																	)}
																</SelectItem>
																<SelectItem value='ADMIN'>
																	{t(
																		'common:roles.admin',
																	)}
																</SelectItem>
															</SelectContent>
														</Select>
													)}
												/>
											)}
											{pm.isSelf && (
												<p className='text-muted-foreground text-sm'>
													{t(
														'users.edit.selfRoleHint',
													)}
												</p>
											)}
										</div>

										<div className='flex items-center justify-between'>
											<Label htmlFor='is_verified'>
												{t(
													'users.edit.emailVerifiedLabel',
												)}
											</Label>
											<Controller
												control={pm.control}
												name='is_verified'
												render={({ field }) => (
													<Switch
														id='is_verified'
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
														disabled={
															pm.emailChanged
														}
													/>
												)}
											/>
										</div>

										<div className='flex items-center justify-between'>
											<div>
												<Label htmlFor='is_active'>
													{t(
														'users.edit.activeLabel',
													)}
												</Label>
												{pm.isSelf && (
													<p className='text-muted-foreground text-sm'>
														{t(
															'users.edit.selfDeactivateHint',
														)}
													</p>
												)}
											</div>
											<Controller
												control={pm.control}
												name='is_active'
												render={({ field }) => (
													<Switch
														id='is_active'
														checked={field.value}
														onCheckedChange={
															field.onChange
														}
														disabled={pm.isSelf}
													/>
												)}
											/>
										</div>

										<div className='flex gap-2'>
											<Button
												type='submit'
												disabled={pm.isSaving}
												className='flex-1'
											>
												{t('users.edit.save')}
											</Button>
											<Button
												type='button'
												variant='ghost'
												onClick={pm.cancel}
											>
												{t('common:actions.cancel')}
											</Button>
										</div>
									</div>
								</form>

								<ConfirmDialog
									{...pm.confirmDeactivate}
									title={t('users.edit.confirmTitle')}
									description={t(
										'users.edit.confirmDescription',
										{ username: pm.user.username },
									)}
									confirmLabel={t('users.edit.confirmLabel')}
								/>
							</CardContent>
						</>
					)}
				</Card>

				{!pm.isLoading && !pm.isError && pm.user && (
					<div className='w-full max-w-3xl'>
						<UserProfilesCard
							userId={pm.user.id}
							userIsAdmin={pm.user.role === 'ADMIN'}
						/>
					</div>
				)}
			</div>
		</>
	)
}
