import { useState } from 'react'

import { PageTitle } from '@/components/title/page-title'
import {
	type TransferColumn,
	TransferTable,
} from '@/components/transfer-table'
import { Checkbox } from '@/components/ui/checkbox'

// TEMPORARY Phase-3 playground for the TransferTable. Removed in Phase 4 once
// the component is wired into the real Manage Profiles screen. Reachable at
// /transfer-demo (any authenticated user).

interface DemoScreen {
	id: string
	key: string
	name: string
}

type Actions = { view: boolean; create: boolean; edit: boolean; delete: boolean }

const SCREENS: DemoScreen[] = [
	{ id: '1', key: 'gym.dashboard', name: 'Dashboard' },
	{ id: '2', key: 'gym.gyms', name: 'Gyms' },
	{ id: '3', key: 'gym.check-in', name: 'Check-in' },
	{ id: '4', key: 'gym.history', name: 'Check-in History' },
	{ id: '5', key: 'gym.validations', name: 'Validate Check-ins' },
	{ id: '6', key: 'access-control.modules', name: 'Manage Modules' },
	{ id: '7', key: 'access-control.screens', name: 'Manage Screens' },
	{ id: '8', key: 'access-control.profiles', name: 'Manage Profiles' },
	{ id: '9', key: 'access-control.users', name: 'Manage Users' },
]

export function TransferDemo() {
	const [assignedIds, setAssignedIds] = useState<string[]>(['1', '3'])
	const [actions, setActions] = useState<Record<string, Actions>>({
		'1': { view: true, create: false, edit: false, delete: false },
		'3': { view: true, create: false, edit: false, delete: false },
	})

	// Keep the action grants in sync with membership: a newly granted screen
	// starts with view=true (PLAN "can_view default true"); a removed one drops
	// its grant. This is the pattern the real Manage Profiles screen will use.
	function handleAssignedChange(ids: string[]) {
		setAssignedIds(ids)
		setActions((prev) => {
			const next: Record<string, Actions> = {}
			for (const id of ids) {
				next[id] = prev[id] ?? {
					view: true,
					create: false,
					edit: false,
					delete: false,
				}
			}
			return next
		})
	}

	function toggleAction(id: string, key: keyof Actions) {
		setActions((prev) => {
			const current = prev[id] ?? {
				view: true,
				create: false,
				edit: false,
				delete: false,
			}
			return { ...prev, [id]: { ...current, [key]: !current[key] } }
		})
	}

	function actionCell(id: string, key: keyof Actions) {
		const current = actions[id]?.[key] ?? false
		return (
			<Checkbox
				checked={current}
				onCheckedChange={() => toggleAction(id, key)}
				aria-label={key}
			/>
		)
	}

	const nameColumn: TransferColumn<DemoScreen> = {
		key: 'name',
		header: 'Screen',
		cell: (s) => (
			<div className='flex flex-col'>
				<span className='font-medium'>{s.name}</span>
				<span className='text-muted-foreground text-xs'>{s.key}</span>
			</div>
		),
	}

	const assignedColumns: TransferColumn<DemoScreen>[] = [
		nameColumn,
		...(['view', 'create', 'edit', 'delete'] as const).map((action) => ({
			key: action,
			header: action[0].toUpperCase() + action.slice(1),
			className: 'text-center',
			cell: (s: DemoScreen) => actionCell(s.id, action),
		})),
	]

	return (
		<>
			<PageTitle title='TransferTable demo' />
			<div className='flex flex-1 flex-col gap-4 p-8'>
				<div>
					<h1 className='text-2xl font-bold'>TransferTable</h1>
					<p className='text-muted-foreground text-sm'>
						Select rows and move with the buttons, or drag the handle
						(multi-select aware). The assigned side carries the
						action toggles.
					</p>
				</div>

				<TransferTable
					items={SCREENS}
					getRowId={(s) => s.id}
					assignedIds={assignedIds}
					onAssignedChange={handleAssignedChange}
					availableColumns={[nameColumn]}
					assignedColumns={assignedColumns}
					labels={{ available: 'Available screens', assigned: 'Granted' }}
					searchable
					getSearchText={(s) => `${s.name} ${s.key}`}
				/>

				<pre className='bg-muted overflow-auto rounded-md p-3 text-xs'>
					{JSON.stringify({ assignedIds, actions }, null, 2)}
				</pre>
			</div>
		</>
	)
}
