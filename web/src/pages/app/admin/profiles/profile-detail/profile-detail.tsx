import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router'

import type { ScreenModel } from '@/api/screens'
import { PageTitle } from '@/components/title/page-title'
import {
	type TransferColumn,
	TransferTable,
} from '@/components/transfer-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import { useProfileDetailPM } from './use-profile-detail-pm'

const ACTIONS = ['view', 'create', 'edit', 'delete'] as const

export function ProfileDetail() {
	const pm = useProfileDetailPM()

	if (pm.isLoading) {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<LoaderCircle className='text-muted-foreground size-6 animate-spin' />
			</div>
		)
	}

	if (pm.notFound || !pm.profile) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-8'>
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

	const nameColumn: TransferColumn<ScreenModel> = {
		key: 'name',
		header: 'Screen',
		cell: (s) => (
			<div className='flex flex-col'>
				<span className='font-medium'>{s.name}</span>
				<span className='text-muted-foreground text-xs'>{s.key}</span>
			</div>
		),
	}

	const assignedColumns: TransferColumn<ScreenModel>[] = [
		nameColumn,
		...ACTIONS.map((action) => ({
			key: action,
			header: action[0].toUpperCase() + action.slice(1),
			className: 'text-center',
			cell: (s: ScreenModel) => (
				<Checkbox
					checked={pm.grants[s.id]?.[action] ?? false}
					onCheckedChange={() => pm.toggleAction(s.id, action)}
					disabled={!pm.canEdit}
					aria-label={`${s.key} ${action}`}
				/>
			),
		})),
	]

	return (
		<>
			<PageTitle title={`Profile · ${pm.profile.name}`} />

			<div className='flex flex-1 flex-col gap-6 p-8'>
				<div className='flex items-center gap-3'>
					<Button asChild variant='ghost' size='icon'>
						<Link to='/admin/profiles' aria-label='Back'>
							<ArrowLeft />
						</Link>
					</Button>
					<div className='flex-1'>
						<h1 className='flex items-center gap-2 text-2xl font-bold'>
							{pm.profile.name}
							{pm.profile.isSystem && (
								<Badge variant='outline'>System</Badge>
							)}
						</h1>
						<p className='text-muted-foreground font-mono text-xs'>
							{pm.profile.key}
						</p>
					</div>
					{pm.canEdit && (
						<Button onClick={pm.save} disabled={pm.isSaving}>
							Save changes
						</Button>
					)}
				</div>

				<div className='grid gap-4 sm:grid-cols-2'>
					<div className='grid gap-2'>
						<Label htmlFor='profile-name'>Name</Label>
						<Input
							id='profile-name'
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
				</div>

				<div className='flex items-center justify-between rounded-md border p-4'>
					<div>
						<Label>Default profile</Label>
						<p className='text-muted-foreground text-xs'>
							Auto-attached to users on registration.
						</p>
					</div>
					<Switch
						checked={pm.isDefault}
						onCheckedChange={pm.setIsDefault}
						disabled={!pm.canEdit}
					/>
				</div>

				<div className='flex flex-col gap-2'>
					<h2 className='text-lg font-medium'>Screen grants</h2>
					<p className='text-muted-foreground text-sm'>
						Move screens to "Granted" and pick the allowed actions.
					</p>
					<TransferTable
						items={pm.screens}
						getRowId={(s) => s.id}
						assignedIds={pm.assignedIds}
						onAssignedChange={pm.handleAssignedChange}
						availableColumns={[nameColumn]}
						assignedColumns={assignedColumns}
						labels={{
							available: 'Available screens',
							assigned: 'Granted',
						}}
						searchable
						getSearchText={(s) => `${s.name} ${s.key}`}
					/>
				</div>
			</div>
		</>
	)
}
