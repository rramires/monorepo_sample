import {
	type CreateProfileBody,
	profileDetailSchema,
	profileSchema,
	type UpdateProfileBody,
} from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

export interface ProfileModel {
	id: string
	key: string
	name: string
	description: string | null
	isSystem: boolean
	isDefault: boolean
	isActive: boolean
}

// One assigned screen inside a profile: membership + the granted permission ids
// (a subset of the screen's curated catalog). An empty list = member, no perms.
export interface ProfileScreenGrantModel {
	screenId: string
	permissionIds: string[]
}

export interface ProfileDetailModel extends ProfileModel {
	defaultScreenId: string | null
	screens: ProfileScreenGrantModel[]
}

const listSchema = z.object({ profiles: z.array(profileSchema) })
const oneSchema = z.object({ profile: profileSchema })

function toModel(p: z.infer<typeof profileSchema>): ProfileModel {
	return {
		id: p.id,
		key: p.key,
		name: p.name,
		description: p.description ?? null,
		isSystem: p.is_system,
		isDefault: p.is_default,
		isActive: p.is_active,
	}
}

function toDetail(p: z.infer<typeof profileDetailSchema>): ProfileDetailModel {
	return {
		...toModel(p),
		defaultScreenId: p.default_screen_id,
		screens: p.screens.map((s) => ({
			screenId: s.screen_id,
			permissionIds: s.permission_ids,
		})),
	}
}

export async function getProfiles(): Promise<ProfileModel[]> {
	const response = await api.get('/profiles')
	return listSchema.parse(response.data).profiles.map(toModel)
}

export async function getProfile(id: string): Promise<ProfileDetailModel> {
	const response = await api.get(`/profiles/${id}`)
	return toDetail(profileDetailSchema.parse(response.data))
}

export async function createProfile(
	body: CreateProfileBody,
): Promise<ProfileModel> {
	const response = await api.post('/profiles', body)
	return toModel(oneSchema.parse(response.data).profile)
}

export async function updateProfile(
	id: string,
	body: UpdateProfileBody,
): Promise<ProfileModel> {
	const response = await api.patch(`/profiles/${id}`, body)
	return toModel(oneSchema.parse(response.data).profile)
}

export async function deleteProfile(id: string): Promise<void> {
	await api.delete(`/profiles/${id}`)
}

// Replace the profile's memberships, per-screen granted permissions and landing
// screen in one call (the profile-detail save).
export async function setProfileGrants(
	id: string,
	grants: ProfileScreenGrantModel[],
	defaultScreenId: string | null,
): Promise<ProfileDetailModel> {
	const body = {
		screens: grants.map((g) => ({
			screen_id: g.screenId,
			permission_ids: g.permissionIds,
		})),
		default_screen_id: defaultScreenId,
	}
	const response = await api.put(`/profiles/${id}/screens`, body)
	return toDetail(profileDetailSchema.parse(response.data))
}
