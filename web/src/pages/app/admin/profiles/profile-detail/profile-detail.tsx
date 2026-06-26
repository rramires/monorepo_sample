import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { PageTitle } from '@/components/title/page-title'
import { type TransferColumn, TransferTable } from '@/components/transfer-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { type ScreenRow, useProfileDetailPM } from './use-profile-detail-pm'

export function ProfileDetail() {
	const pm = useProfileDetailPM()
	const { t } = useTranslation(['admin', 'common'])

	if (pm.isLoading) {
		return (
			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (pm.notFound || !pm.profile) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-4 sm:p-8'>
				<p className='text-muted-foreground text-sm'>
					{t('profiles.detail.notFound')}
				</p>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/admin/profiles'>
						<ArrowLeft />
						{t('profiles.detail.back')}
					</Link>
				</Button>
			</div>
		)
	}

	const nameColumn: TransferColumn<ScreenRow> = {
		key: 'name',
		header: t('profiles.detail.columns.screen'),
		cell: (s) => (
			<div className='flex flex-col'>
				<span className='flex items-center gap-2 font-medium'>
					{/* Dim the name+key (but not the badge) when disabled. */}
					<span className={cn(!s.isActive && 'opacity-50')}>
						{s.name}
					</span>
					{!s.isActive && (
						<Badge variant='outline'>
							{t('profiles.detail.disabled')}
						</Badge>
					)}
				</span>
				<span
					className={cn(
						'text-muted-foreground text-xs',
						!s.isActive && 'opacity-50',
					)}
				>
					{s.key}
				</span>
			</div>
		),
	}

	const moduleColumn: TransferColumn<ScreenRow> = {
		key: 'module',
		header: t('profiles.detail.columns.module'),
		cell: (s) => (
			<span
				className={cn(
					'text-muted-foreground text-sm',
					!s.isActive && 'opacity-50',
				)}
			>
				{s.moduleName}
			</span>
		),
	}

	const availableColumns: TransferColumn<ScreenRow>[] = [
		nameColumn,
		moduleColumn,
	]

	const assignedColumns: TransferColumn<ScreenRow>[] = [
		nameColumn,
		moduleColumn,
		{
			key: 'permissions',
			header: t('profiles.detail.columns.permissions'),
			className: 'min-w-56',
			cell: (s: ScreenRow) => {
				const options = (pm.permsByScreen.get(s.id) ?? []).map((p) => ({
					value: p.id,
					label: p.label,
				}))
				if (options.length === 0) {
					return (
						<span
							className={cn(
								'text-muted-foreground text-xs',
								!s.isActive && 'opacity-50',
							)}
						>
							{t('profiles.detail.noPermissionsDefined')}
						</span>
					)
				}
				return (
					<MultiSelect
						options={options}
						selected={pm.grants[s.id] ?? []}
						onChange={(ids) => pm.setScreenPermissions(s.id, ids)}
						// A disabled screen is on its way out — lock its permissions.
						disabled={!pm.canEdit || !s.isActive}
						placeholder={t('profiles.detail.noPermissions')}
						searchPlaceholder={t(
							'profiles.detail.searchPermissions',
						)}
						emptyText={t('profiles.detail.noPermissionsEmpty')}
					/>
				)
			},
		},
		{
			key: 'landing',
			header: t('profiles.detail.columns.landing'),
			className: 'text-center',
			cell: (s: ScreenRow) => (
				<Checkbox
					checked={pm.defaultScreenId === s.id}
					onCheckedChange={() => pm.setDefault(s.id)}
					// Only a viewable, active screen can be the landing.
					disabled={
						!pm.canEdit || !pm.isViewable(s.id) || !s.isActive
					}
					aria-label={t('profiles.detail.landingAria', {
						key: s.key,
					})}
				/>
			),
		},
	]

	return (
		<>
			<PageTitle
				title={t('profiles.detail.pageTitle', {
					name: pm.profile.name,
				})}
			/>

			<div className='flex flex-1 flex-col gap-6 px-8 pt-5 pb-8'>
				<PageHeader
					leading={
						<Button asChild variant='ghost' size='icon'>
							<Link
								to='/admin/profiles'
								aria-label={t('common:actions.back')}
							>
								<ArrowLeft />
							</Link>
						</Button>
					}
					title={
						<span className='flex items-center gap-2'>
							{pm.profile.name}
							{pm.profile.isSystem && (
								<Badge variant='outline'>
									{t('common:status.system')}
								</Badge>
							)}
						</span>
					}
					description={
						<span className='font-mono text-xs'>
							{pm.profile.key}
						</span>
					}
				>
					{pm.canEdit && (
						<Button onClick={pm.save} disabled={pm.isSaving}>
							{t('profiles.detail.save')}
						</Button>
					)}
				</PageHeader>

				<Card>
					<CardContent className='flex flex-col gap-4'>
						<div className='grid gap-4 lg:grid-cols-2'>
							<div className='grid gap-2'>
								<Label htmlFor='profile-name'>
									{t('profiles.detail.nameLabel')}
								</Label>
								<Input
									id='profile-name'
									autoFocus
									value={pm.name}
									onChange={(e) => pm.setName(e.target.value)}
									disabled={!pm.canEdit}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='profile-description'>
									{t('profiles.detail.descriptionLabel')}
								</Label>
								<Input
									id='profile-description'
									value={pm.description}
									onChange={(e) =>
										pm.setDescription(e.target.value)
									}
									disabled={!pm.canEdit}
								/>
							</div>
						</div>

						<div className='flex items-center justify-between gap-4 border-t pt-4'>
							<div>
								<Label>
									{t('profiles.detail.defaultLabel')}
								</Label>
								<p className='text-muted-foreground text-xs'>
									{pm.profile.isDefault
										? t(
												'profiles.detail.defaultHintCurrent',
											)
										: t('profiles.detail.defaultHint')}
								</p>
							</div>
							<Switch
								checked={pm.isDefault}
								onCheckedChange={pm.setIsDefault}
								aria-label={t('profiles.detail.defaultLabel')}
								// The current default can't be switched off (it
								// would leave zero); promote another profile.
								disabled={!pm.canEdit || pm.profile.isDefault}
							/>
						</div>

						<div className='flex items-center justify-between gap-4 border-t pt-4'>
							<div>
								<Label>
									{t('profiles.detail.activeLabel')}
								</Label>
								<p className='text-muted-foreground text-xs'>
									{t('profiles.detail.activeHint')}
								</p>
							</div>
							<Switch
								checked={pm.isActive}
								onCheckedChange={pm.setIsActive}
								aria-label={t('profiles.detail.activeLabel')}
								disabled={!pm.canEdit}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>
							{t('profiles.detail.grantsTitle')}
						</CardTitle>
						<CardDescription>
							{t('profiles.detail.grantsDescription')}
						</CardDescription>
					</CardHeader>
					<CardContent className='flex flex-col gap-6'>
						{/* Mirror the TransferTable's columns so the filter lines
						    up with the Available search: flex-1 + the move-button
						    column (w-8) + the Granted panel (flex-1). */}
						<div className='flex flex-col gap-3 lg:flex-row'>
							<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
								<Label className='text-muted-foreground text-xs'>
									{t('profiles.detail.filterByModule')}
								</Label>
								<MultiSelect
									options={pm.moduleOptions}
									selected={pm.moduleFilter}
									onChange={pm.setModuleFilter}
									placeholder={t(
										'profiles.detail.allModules',
									)}
									searchPlaceholder={t(
										'profiles.detail.searchModules',
									)}
									emptyText={t('profiles.detail.noModules')}
								/>
							</div>
							<div className='hidden w-8 lg:block' aria-hidden />
							<div
								className='hidden min-w-0 flex-1 lg:block'
								aria-hidden
							/>
						</div>

						<TransferTable
							items={pm.screens}
							getRowId={(s) => s.id}
							assignedIds={pm.assignedIds}
							onAssignedChange={pm.handleAssignedChange}
							availableColumns={availableColumns}
							assignedColumns={assignedColumns}
							labels={{
								available: t(
									'profiles.detail.availableScreens',
								),
								assigned: t('profiles.detail.granted'),
							}}
							searchable
							getSearchText={(s) =>
								`${s.name} ${s.key} ${s.moduleName}`
							}
						/>
					</CardContent>
				</Card>

				<ConfirmDialog
					{...pm.confirmDefault}
					title={t('profiles.detail.confirmDefault.title')}
					description={t(
						'profiles.detail.confirmDefault.description',
						{ name: pm.currentDefaultName ?? '' },
					)}
					confirmLabel={t(
						'profiles.detail.confirmDefault.confirmLabel',
					)}
				/>

				<ConfirmDialog
					{...pm.confirmRemoveDisabled}
					title={t('profiles.detail.confirmRemove.title')}
					description={t('profiles.detail.confirmRemove.description')}
					confirmLabel={t(
						'profiles.detail.confirmRemove.confirmLabel',
					)}
				/>

				<ConfirmDialog
					{...pm.confirmDeactivate}
					title={t('profiles.detail.confirmDeactivate.title')}
					description={t(
						'profiles.detail.confirmDeactivate.description',
						{ name: pm.profile.name },
					)}
					confirmLabel={t(
						'profiles.detail.confirmDeactivate.confirmLabel',
					)}
				/>
			</div>
		</>
	)
}
