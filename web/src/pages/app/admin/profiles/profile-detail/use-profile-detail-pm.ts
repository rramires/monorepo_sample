import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { getModules } from '@/api/modules'
import {
	getProfile,
	getProfiles,
	type GrantModel,
	setProfileScreens,
	updateProfile,
} from '@/api/profiles'
import { getScreens, type ScreenModel } from '@/api/screens'
import { usePermissions } from '@/hooks/use-permissions'

type Actions = Pick<GrantModel, 'view' | 'create' | 'edit' | 'delete'>

// A screen row enriched with its module's key/name, so the grants table can
// show a module column and filter by module without a second lookup per row.
export interface ScreenRow extends ScreenModel {
	moduleKey: string
	moduleName: string
}

const VIEW_DEFAULT: Actions = {
	view: true,
	create: false,
	edit: false,
	delete: false,
}

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

	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isDefault, setIsDefault] = useState(false)
	const [assignedIds, setAssignedIds] = useState<string[]>([])
	const [grants, setGrants] = useState<Record<string, Actions>>({})
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

	// The module filter narrows only the Available side: always keep already-
	// granted screens in the universe so the Granted side stays complete (the
	// TransferTable drops assigned rows from Available on its own).
	const visibleScreens = useMemo(() => {
		if (moduleFilter.length === 0) {
			return screenRows
		}
		const mods = new Set(moduleFilter)
		const assigned = new Set(assignedIds)
		return screenRows.filter(
			(s) => mods.has(s.moduleId) || assigned.has(s.id),
		)
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
		setDefaultScreenId(
			profile.screens.find((g) => g.isDefault)?.screenId ?? null,
		)
		setGrants(
			Object.fromEntries(
				profile.screens.map((g) => [
					g.screenId,
					{
						view: g.view,
						create: g.create,
						edit: g.edit,
						delete: g.delete,
					},
				]),
			),
		)
	}, [profile])
	/* eslint-enable react-hooks/set-state-in-effect */

	// Keep grants in sync with membership: a newly granted screen starts at
	// view=true; a removed one drops its grant.
	function handleAssignedChange(ids: string[]) {
		setAssignedIds(ids)
		setGrants((prev) => {
			const next: Record<string, Actions> = {}
			for (const id of ids) {
				next[id] = prev[id] ?? { ...VIEW_DEFAULT }
			}
			return next
		})
		// Drop the default if its screen was removed.
		setDefaultScreenId((prev) => (prev && ids.includes(prev) ? prev : null))
	}

	// Radio-style: pick the profile's default screen (click again to clear).
	function setDefault(screenId: string) {
		setDefaultScreenId((prev) => (prev === screenId ? null : screenId))
	}

	function toggleAction(screenId: string, key: keyof Actions) {
		setGrants((prev) => {
			const current = prev[screenId] ?? { ...VIEW_DEFAULT }
			return {
				...prev,
				[screenId]: { ...current, [key]: !current[key] },
			}
		})
	}

	const save = useMutation({
		mutationFn: async () => {
			await updateProfile(profileId, {
				name,
				description: description || null,
				is_default: isDefault,
			})
			const list: GrantModel[] = assignedIds.map((screenId) => ({
				screenId,
				...(grants[screenId] ?? VIEW_DEFAULT),
				isDefault: screenId === defaultScreenId,
			}))
			await setProfileScreens(profileId, list)
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
		defaultScreenId,
		setDefault,
		handleAssignedChange,
		toggleAction,
		canEdit: can('access-control.profiles', 'edit'),
		save: requestSave,
		isSaving: save.isPending,
		currentDefaultName: currentDefault?.name ?? null,
		confirmDefault: {
			open: confirmDefaultOpen,
			onOpenChange: onConfirmDefaultOpenChange,
			onConfirm: confirmReplaceDefault,
		},
	}
}
