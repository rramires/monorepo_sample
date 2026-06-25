import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'

import { useSetBreadcrumb } from '@/components/breadcrumb/breadcrumb-hooks'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PageHeader } from '@/components/page-header'
import { PageTitle } from '@/components/title/page-title'
import { type TransferColumn, TransferTable } from '@/components/transfer-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { Switch } from '@/components/ui/switch'

import { type ScreenRow, useProfileDetailPM } from './use-profile-detail-pm'

const ACTIONS = ['view', 'create', 'edit', 'delete'] as const

export function ProfileDetail() {
	const pm = useProfileDetailPM()

	// Publish the profile name as the breadcrumb's dynamic leaf.
	useSetBreadcrumb(pm.profile?.name)

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
					Profile not found.
				</p>
				<Button asChild variant='outline' className='w-fit'>
					<Link to='/admin/profiles'>
						<ArrowLeft />
						Back to profiles
					</Link>
				</Button>
			</div>
		)
	}

	const nameColumn: TransferColumn<ScreenRow> = {
		key: 'name',
		header: 'Screen',
		cell: (s) => (
			<div className='flex flex-col'>
				<span className='font-medium'>{s.name}</span>
				<span className='text-muted-foreground text-xs'>{s.key}</span>
			</div>
		),
	}

	const moduleColumn: TransferColumn<ScreenRow> = {
		key: 'module',
		header: 'Module',
		cell: (s) => (
			<span className='text-muted-foreground text-sm'>
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
		...ACTIONS.map((action) => ({
			key: action,
			header: action[0].toUpperCase() + action.slice(1),
			className: 'text-center',
			cell: (s: ScreenRow) => (
				<Checkbox
					checked={pm.grants[s.id]?.[action] ?? false}
					onCheckedChange={() => pm.toggleAction(s.id, action)}
					disabled={!pm.canEdit}
					aria-label={`${s.key} ${action}`}
				/>
			),
		})),
		{
			key: 'default',
			header: 'Default',
			className: 'text-center',
			cell: (s: ScreenRow) => (
				<Checkbox
					checked={pm.defaultScreenId === s.id}
					onCheckedChange={() => pm.setDefault(s.id)}
					disabled={!pm.canEdit}
					aria-label={`${s.key} default`}
				/>
			),
		},
	]

	return (
		<>
			<PageTitle title={`Profile · ${pm.profile.name}`} />

			<div className='flex flex-1 flex-col gap-3 px-8 pt-5 pb-8'>
				<PageHeader
					leading={
						<Button asChild variant='ghost' size='icon'>
							<Link to='/admin/profiles' aria-label='Back'>
								<ArrowLeft />
							</Link>
						</Button>
					}
					title={
						<span className='flex items-center gap-2'>
							{pm.profile.name}
							{pm.profile.isSystem && (
								<Badge variant='outline'>System</Badge>
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
							Save changes
						</Button>
					)}
				</PageHeader>

				<div className='grid gap-4 lg:grid-cols-2'>
					<div className='grid gap-2'>
						<Label htmlFor='profile-name'>Name</Label>
						<Input
							id='profile-name'
							autoFocus
							value={pm.name}
							onChange={(e) => pm.setName(e.target.value)}
							disabled={!pm.canEdit}
						/>
					</div>
					<div className='grid gap-2'>
						<Label htmlFor='profile-description'>Description</Label>
						<Input
							id='profile-description'
							value={pm.description}
							onChange={(e) => pm.setDescription(e.target.value)}
							disabled={!pm.canEdit}
						/>
					</div>

					<div className='flex flex-col justify-end gap-2'>
						<h2 className='text-lg font-medium'>Screen grants</h2>
						<p className='text-muted-foreground text-sm'>
							Move screens to "Granted" and pick the allowed
							actions.
						</p>
					</div>

					<div className='flex items-center justify-between rounded-md border p-4'>
						<div>
							<Label>Default profile</Label>
							<p className='text-muted-foreground text-xs'>
								{pm.profile.isDefault
									? 'This is the default profile. Enable Default on another profile to move it.'
									: 'Auto-attached to users on registration.'}
							</p>
						</div>
						<Switch
							checked={pm.isDefault}
							onCheckedChange={pm.setIsDefault}
							// The current default can't be switched off (it would
							// leave zero); promote another profile instead.
							disabled={!pm.canEdit || pm.profile.isDefault}
						/>
					</div>
				</div>

				<div className='flex flex-col gap-2'>
					{/* Mirror the TransferTable's columns so the filter lines up
					    with the Available search: flex-1 + the move-button
					    column (w-8) + the Granted panel (flex-1). */}
					<div className='flex flex-col gap-3 lg:flex-row'>
						<div className='flex min-w-0 flex-1 flex-col gap-1.5'>
							<Label className='text-muted-foreground text-xs'>
								Filter available by module
							</Label>
							<MultiSelect
								options={pm.moduleOptions}
								selected={pm.moduleFilter}
								onChange={pm.setModuleFilter}
								placeholder='All modules'
								searchPlaceholder='Search modules…'
								emptyText='No modules.'
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
							available: 'Available screens',
							assigned: 'Granted',
						}}
						searchable
						getSearchText={(s) =>
							`${s.name} ${s.key} ${s.moduleName}`
						}
					/>
				</div>

				<ConfirmDialog
					{...pm.confirmDefault}
					title='Replace default profile'
					description={`The current default profile is: ${pm.currentDefaultName}. Do you confirm that you want to replace it as the default?`}
					confirmLabel='Replace'
				/>
			</div>
		</>
	)
}
