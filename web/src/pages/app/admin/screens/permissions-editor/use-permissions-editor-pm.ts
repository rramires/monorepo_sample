import {
	actionFamily,
	actionKeySchema,
	actionLabelSchema,
	composeActionKey,
	PERMISSION_FAMILIES,
	type PermissionFamily,
} from '@root/contracts'
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

// The four CRUD families + how the op Select labels them (distinct from the
// user's friendly grant label, which is free text). A screen's action can also be
// a composed key (`create_checkin`) — see `opBadge` for how those render.
export const ALL_ACTIONS: readonly PermissionFamily[] = PERMISSION_FAMILIES
export const ACTION_LABEL: Record<PermissionFamily, string> = {
	view: 'View',
	create: 'Create',
	edit: 'Edit',
	delete: 'Delete',
}

// The badge text for a permission's action key: a bare family shows its friendly
// op label (`create` → "Create"); a composed key shows the raw key
// (`create_checkin`) so its extra-op nature is visible at a glance.
export function opBadge(action: string): string {
	const family = actionFamily(action)
	return action === family
		? (ACTION_LABEL[family as PermissionFamily] ?? action)
		: action
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

	// Add-row draft. `op` is the Operation Select: a bare CRUD family, or `other`
	// to compose an extra key from a family + a free name. `newFamily`+`newName`
	// only matter when `op === 'other'`.
	const [op, setOp] = useState<PermissionFamily | 'other' | ''>('')
	const [newFamily, setNewFamily] = useState<PermissionFamily | ''>('')
	const [newName, setNewName] = useState('')
	const [newLabel, setNewLabel] = useState('')
	// Inline edit: the unlocked row id + its draft label.
	const [editingId, setEditingId] = useState<string | null>(null)
	const [draftLabel, setDraftLabel] = useState('')

	const usedKeys = useMemo(
		() => new Set(permissions.map((p) => p.action)),
		[permissions],
	)
	// Bare families the screen doesn't already offer. `Other…` is always available
	// (a screen can hold many composed keys sharing a family).
	const availableFamilies = useMemo(
		() => ALL_ACTIONS.filter((f) => !usedKeys.has(f)),
		[usedKeys],
	)

	const isOther = op === 'other'
	const namePart = newName.trim()
	// The final action key the editor will send: the bare op, or the composed
	// `family_name`. Empty until the draft is complete enough to preview.
	const composedKey = isOther
		? newFamily && namePart
			? composeActionKey(newFamily, namePart)
			: ''
		: op

	async function invalidate() {
		// Prefix-invalidate so the profile-detail catalog (['permissions']) and
		// this screen's list both refresh.
		await queryClient.invalidateQueries({ queryKey: ['permissions'] })
	}

	const add = useMutation({
		mutationFn: () =>
			createPermission(screenId, {
				action: composedKey,
				label: newLabel.trim(),
			}),
		onSuccess: async () => {
			toast.success('Permission added.')
			setOp('')
			setNewFamily('')
			setNewName('')
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

	// Name part of a composed key: starts with a letter, lowercase + underscore,
	// 2–32 chars (family prefix + the 40-char cap are enforced by actionKeySchema).
	const nameValid =
		/^[a-z][a-z_]*$/.test(namePart) &&
		namePart.length >= 2 &&
		namePart.length <= 32
	const keyValid =
		composedKey !== '' &&
		!usedKeys.has(composedKey) &&
		actionKeySchema.safeParse(composedKey).success &&
		(!isOther || (newFamily !== '' && nameValid))
	const labelValid = actionLabelSchema.safeParse(newLabel).success
	const canAdd = keyValid && labelValid

	return {
		permissions,
		isLoading,
		// add row
		op,
		setOp,
		isOther,
		availableFamilies,
		newFamily,
		setNewFamily,
		newName,
		setNewName,
		composedKey,
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
