import type { PermissionAction } from '@root/contracts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
	createPermission,
	deletePermission,
	getPermissions,
	updatePermission,
} from '@/api/permissions'

// The fixed code-contract actions + how the op Select labels them (distinct from
// the user's friendly grant label, which is free text).
export const ALL_ACTIONS: PermissionAction[] = [
	'view',
	'create',
	'edit',
	'delete',
]
export const ACTION_LABEL: Record<PermissionAction, string> = {
	view: 'View',
	create: 'Create',
	edit: 'Edit',
	delete: 'Delete',
}

function message(err: unknown, fallback: string): string {
	return (isAxiosError(err) && err.response?.data?.message) || fallback
}

// Drives the todo-style permission editor for one screen: list rows, add a row
// (curated op + friendly label), unlock-to-edit a label, delete — each mutating
// the catalog through the permissions API. `enabled` keeps the query idle until
// the dialog opens.
export function usePermissionsEditorPM(screenId: string, enabled: boolean) {
	const queryClient = useQueryClient()

	const { data: permissions = [], isLoading } = useQuery({
		queryKey: ['permissions', screenId],
		queryFn: () => getPermissions(screenId),
		enabled,
	})

	// Add-row draft.
	const [newAction, setNewAction] = useState<PermissionAction | ''>('')
	const [newLabel, setNewLabel] = useState('')
	// Inline edit: the unlocked row id + its draft label.
	const [editingId, setEditingId] = useState<string | null>(null)
	const [draftLabel, setDraftLabel] = useState('')

	// A screen offers each op at most once — hide already-used ones in the Select.
	const availableActions = useMemo(() => {
		const used = new Set(permissions.map((p) => p.action))
		return ALL_ACTIONS.filter((a) => !used.has(a))
	}, [permissions])

	async function invalidate() {
		// Prefix-invalidate so the profile-detail catalog (['permissions']) and
		// this screen's list both refresh.
		await queryClient.invalidateQueries({ queryKey: ['permissions'] })
	}

	const add = useMutation({
		mutationFn: () =>
			createPermission(screenId, {
				action: newAction as PermissionAction,
				label: newLabel.trim(),
			}),
		onSuccess: async () => {
			toast.success('Permission added.')
			setNewAction('')
			setNewLabel('')
			await invalidate()
		},
		onError: (err) =>
			toast.error(message(err, 'Could not add the permission.')),
	})

	const rename = useMutation({
		mutationFn: ({ id, label }: { id: string; label: string }) =>
			updatePermission(id, { label: label.trim() }),
		onSuccess: async () => {
			toast.success('Permission saved.')
			setEditingId(null)
			setDraftLabel('')
			await invalidate()
		},
		onError: (err) =>
			toast.error(message(err, 'Could not save the permission.')),
	})

	const remove = useMutation({
		mutationFn: (id: string) => deletePermission(id),
		onSuccess: async () => {
			toast.success('Permission deleted.')
			await invalidate()
		},
		onError: (err) =>
			toast.error(message(err, 'Could not delete the permission.')),
	})

	function startEdit(id: string, label: string) {
		setEditingId(id)
		setDraftLabel(label)
	}

	function cancelEdit() {
		setEditingId(null)
		setDraftLabel('')
	}

	const canAdd =
		availableActions.length > 0 &&
		newAction !== '' &&
		newLabel.trim().length > 0

	return {
		permissions,
		isLoading,
		availableActions,
		// add row
		newAction,
		setNewAction,
		newLabel,
		setNewLabel,
		canAdd,
		add: () => add.mutate(),
		isAdding: add.isPending,
		// inline edit
		editingId,
		draftLabel,
		setDraftLabel,
		startEdit,
		cancelEdit,
		saveEdit: async (id: string) => {
			await rename.mutateAsync({ id, label: draftLabel })
		},
		isSaving: rename.isPending,
		// delete
		remove: async (id: string) => {
			await remove.mutateAsync(id)
		},
		isRemoving: remove.isPending,
	}
}
