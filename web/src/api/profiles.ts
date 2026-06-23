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
}

export interface GrantModel {
	screenId: string
	view: boolean
	create: boolean
	edit: boolean
	delete: boolean
}

export interface ProfileDetailModel extends ProfileModel {
	screens: GrantModel[]
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
	}
}

function toDetail(p: z.infer<typeof profileDetailSchema>): ProfileDetailModel {
	return {
		...toModel(p),
		screens: p.screens.map((s) => ({
			screenId: s.screen_id,
			view: s.can_view,
			create: s.can_create,
			edit: s.can_edit,
			delete: s.can_delete,
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

export async function setProfileScreens(
	id: string,
	grants: GrantModel[],
): Promise<ProfileDetailModel> {
	const body = {
		screens: grants.map((g) => ({
			screen_id: g.screenId,
			can_view: g.view,
			can_create: g.create,
			can_edit: g.edit,
			can_delete: g.delete,
		})),
	}
	const response = await api.put(`/profiles/${id}/screens`, body)
	return toDetail(profileDetailSchema.parse(response.data))
}
