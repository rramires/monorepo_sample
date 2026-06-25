import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { getModules } from '@/api/modules'
import { getPermissions } from '@/api/permissions'
import {
	getProfile,
	getProfiles,
	type ProfileScreenGrantModel,
	setProfileGrants,
	updateProfile,
} from '@/api/profiles'
import { getScreens, type ScreenModel } from '@/api/screens'
import { usePermissions } from '@/hooks/use-permissions'

// A screen row enriched with its module's key/name, so the grants table can
// show a module column and filter by module without a second lookup per row.
export interface ScreenRow extends ScreenModel {
	moduleKey: string
	moduleName: string
}

// Stable display/order of curated ops.
const ACTION_ORDER = { view: 0, create: 1, edit: 2, delete: 3 } as const

export function useProfileDetailPM() {
	const { profileId = '' } = useParams()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { can } = usePermissions()

	const profileQuery = useQuery({
		queryKey: ['profile', profileId],
		queryFn: () => getProfile(profileId),
		enabled: !!profileId,
	})
	const { data: screens = [] } = useQuery({
		queryKey: ['screens'],
		queryFn: () => getScreens(),
	})
	const { data: modules = [] } = useQuery({
		queryKey: ['modules'],
		queryFn: () => getModules(),
	})
	// The other profiles — used to name the current default in the confirm
	// dialog when this profile is being promoted.
	const { data: profiles = [] } = useQuery({
		queryKey: ['profiles'],
		queryFn: () => getProfiles(),
	})
	// The curated permission catalog — drives the per-screen permission badges.
	const { data: permissions = [] } = useQuery({
		queryKey: ['permissions'],
		queryFn: () => getPermissions(),
	})

	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isDefault, setIsDefault] = useState(false)
	const [assignedIds, setAssignedIds] = useState<string[]>([])
	// screenId → granted permission ids (subset of the screen's catalog).
	const [grants, setGrants] = useState<Record<string, string[]>>({})
	// The profile's default landing screen (≤1). Acts like a radio.
	const [defaultScreenId, setDefaultScreenId] = useState<string | null>(null)
	// Module ids chosen in the chips filter; empty = no filter (show all).
	const [moduleFilter, setModuleFilter] = useState<string[]>([])

	// Module lookup + chip options (stable order).
	const modulesById = useMemo(
		() => new Map(modules.map((m) => [m.id, m])),
		[modules],
	)
	const moduleOptions = useMemo(
		() =>
			[...modules]
				.sort((a, b) => a.order - b.order)
				.map((m) => ({ value: m.id, label: m.name })),
		[modules],
	)

	// Permission catalog grouped per screen (ordered view→create→edit→delete).
	const permsByScreen = useMemo(() => {
		const map = new Map<string, typeof permissions>()
		for (const p of permissions) {
			const list = map.get(p.screenId) ?? []
			list.push(p)
			map.set(p.screenId, list)
		}
		for (const list of map.values()) {
			list.sort((a, b) => ACTION_ORDER[a.action] - ACTION_ORDER[b.action])
		}
		return map
	}, [permissions])

	// Screens carry only a moduleId; join the module name/key for the column.
	const screenRows = useMemo<ScreenRow[]>(
		() =>
			screens.map((s) => {
				const m = modulesById.get(s.moduleId)
				return {
					...s,
					moduleKey: m?.key ?? '',
					moduleName: m?.name ?? '—',
				}
			}),
		[screens, modulesById],
	)
	const screenById = useMemo(
		() => new Map(screenRows.map((s) => [s.id, s])),
		[screenRows],
	)

	// What the TransferTable sees. A disabled screen can't be newly assigned, so
	// it's hidden from Available — but kept if it's already granted, so it still
	// shows (muted) on the Granted side and can be removed (one-way). The module
	// filter narrows only Available; granted screens are always kept so the
	// Granted side stays complete.
	const visibleScreens = useMemo(() => {
		const mods = new Set(moduleFilter)
		const assigned = new Set(assignedIds)
		return screenRows.filter((s) => {
			if (!s.isActive && !assigned.has(s.id)) {
				return false
			}
			if (
				moduleFilter.length > 0 &&
				!mods.has(s.moduleId) &&
				!assigned.has(s.id)
			) {
				return false
			}
			return true
		})
	}, [screenRows, moduleFilter, assignedIds])

	// Seed local edit state from the loaded profile (runs when the profile
	// arrives or the id changes).
	const profile = profileQuery.data
	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (!profile) {
			return
		}
		setName(profile.name)
		setDescription(profile.description ?? '')
		setIsDefault(profile.isDefault)
		setAssignedIds(profile.screens.map((g) => g.screenId))
		setDefaultScreenId(profile.defaultScreenId)
		setGrants(
			Object.fromEntries(
				profile.screens.map((g) => [g.screenId, g.permissionIds]),
			),
		)
	}, [profile])
	/* eslint-enable react-hooks/set-state-in-effect */

	// A screen can be the landing only when it's granted `view`.
	function isViewable(screenId: string): boolean {
		const viewPerm = permsByScreen
			.get(screenId)
			?.find((p) => p.action === 'view')
		return !!viewPerm && (grants[screenId] ?? []).includes(viewPerm.id)
	}

	// Apply a membership change: keep grants in sync (a newly granted screen
	// starts with no permissions; a removed one drops its grants) and drop the
	// landing if its screen left.
	function applyAssigned(ids: string[]) {
		setAssignedIds(ids)
		setGrants((prev) => {
			const next: Record<string, string[]> = {}
			for (const id of ids) {
				next[id] = prev[id] ?? []
			}
			return next
		})
		setDefaultScreenId((prev) => (prev && ids.includes(prev) ? prev : null))
	}

	// Removing a disabled screen is one-way (it can't be re-added until
	// re-enabled), so confirm first; everything else applies straight through.
	const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)
	const pendingAssigned = useRef<string[] | null>(null)

	function handleAssignedChange(ids: string[]) {
		const removed = assignedIds.filter((id) => !ids.includes(id))
		const removingDisabled = removed.some(
			(id) => screenById.get(id)?.isActive === false,
		)
		if (removingDisabled) {
			pendingAssigned.current = ids
			setConfirmRemoveOpen(true)
			return
		}
		applyAssigned(ids)
	}

	function onConfirmRemoveOpenChange(next: boolean) {
		setConfirmRemoveOpen(next)
		if (!next) {
			pendingAssigned.current = null
		}
	}

	function confirmRemoveDisabled() {
		const ids = pendingAssigned.current
		pendingAssigned.current = null
		setConfirmRemoveOpen(false)
		if (ids) {
			applyAssigned(ids)
		}
	}

	// Replace a screen's granted permissions (the per-row MultiSelect). Dropping
	// `view` also clears the landing if it pointed here.
	function setScreenPermissions(screenId: string, permissionIds: string[]) {
		setGrants((prev) => ({ ...prev, [screenId]: permissionIds }))
		const viewPerm = permsByScreen
			.get(screenId)
			?.find((p) => p.action === 'view')
		const stillViewable = !!viewPerm && permissionIds.includes(viewPerm.id)
		if (!stillViewable) {
			setDefaultScreenId((prev) => (prev === screenId ? null : prev))
		}
	}

	// Radio-style: pick the profile's landing screen (click again to clear).
	function setDefault(screenId: string) {
		setDefaultScreenId((prev) => (prev === screenId ? null : screenId))
	}

	const save = useMutation({
		mutationFn: async () => {
			await updateProfile(profileId, {
				name,
				description: description || null,
				is_default: isDefault,
			})
			const list: ProfileScreenGrantModel[] = assignedIds.map(
				(screenId) => ({
					screenId,
					permissionIds: grants[screenId] ?? [],
				}),
			)
			await setProfileGrants(profileId, list, defaultScreenId)
		},
		onSuccess: async () => {
			toast.success('Profile saved.')
			await queryClient.invalidateQueries({ queryKey: ['profiles'] })
			await queryClient.invalidateQueries({
				queryKey: ['profile', profileId],
			})
			// Grants may change the current user's own menu/guards.
			await queryClient.invalidateQueries({
				queryKey: ['me-permissions'],
			})
			navigate('/admin/profiles')
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not save the profile.',
			)
		},
	})

	// Confirm-on-promote: making a non-default profile the default replaces the
	// current one, so name it and ask first. The radio (demote others) and the
	// block on removing the last default are enforced server-side; this is the
	// heads-up before that happens.
	const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false)
	const pendingSave = useRef<(() => void) | null>(null)

	const currentDefault = profiles.find(
		(p) => p.isDefault && p.id !== profileId,
	)
	const isPromotingDefault = !!profile && !profile.isDefault && isDefault

	function requestSave() {
		if (isPromotingDefault && currentDefault) {
			pendingSave.current = () => save.mutate()
			setConfirmDefaultOpen(true)
		} else {
			save.mutate()
		}
	}

	// Closing the dialog (Cancel, Esc, backdrop) drops the pending save.
	function onConfirmDefaultOpenChange(next: boolean) {
		setConfirmDefaultOpen(next)
		if (!next) {
			pendingSave.current = null
		}
	}

	function confirmReplaceDefault() {
		const run = pendingSave.current
		pendingSave.current = null
		run?.()
	}

	return {
		isLoading: profileQuery.isLoading,
		notFound: profileQuery.isError,
		profile,
		screens: visibleScreens,
		moduleOptions,
		moduleFilter,
		setModuleFilter,
		name,
		setName,
		description,
		setDescription,
		isDefault,
		setIsDefault,
		assignedIds,
		grants,
		permsByScreen,
		isViewable,
		defaultScreenId,
		setDefault,
		setScreenPermissions,
		handleAssignedChange,
		canEdit: can('access-control.profiles', 'edit'),
		save: requestSave,
		isSaving: save.isPending,
		currentDefaultName: currentDefault?.name ?? null,
		confirmDefault: {
			open: confirmDefaultOpen,
			onOpenChange: onConfirmDefaultOpenChange,
			onConfirm: confirmReplaceDefault,
		},
		confirmRemoveDisabled: {
			open: confirmRemoveOpen,
			onOpenChange: onConfirmRemoveOpenChange,
			onConfirm: confirmRemoveDisabled,
		},
	}
}
