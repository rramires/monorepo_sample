import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import {
	getProfile,
	type GrantModel,
	setProfileScreens,
	updateProfile,
} from '@/api/profiles'
import { getScreens } from '@/api/screens'
import { usePermissions } from '@/hooks/use-permissions'

type Actions = Pick<GrantModel, 'view' | 'create' | 'edit' | 'delete'>

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

	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [isDefault, setIsDefault] = useState(false)
	const [assignedIds, setAssignedIds] = useState<string[]>([])
	const [grants, setGrants] = useState<Record<string, Actions>>({})
	// The profile's default landing screen (≤1). Acts like a radio.
	const [defaultScreenId, setDefaultScreenId] = useState<string | null>(null)

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

	return {
		isLoading: profileQuery.isLoading,
		notFound: profileQuery.isError,
		profile,
		screens,
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
		save: () => save.mutate(),
		isSaving: save.isPending,
	}
}
