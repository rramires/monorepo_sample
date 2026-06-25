import {
	type CreatePermissionBody,
	type PermissionAction,
	permissionSchema,
	type UpdatePermissionBody,
} from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

// The app-side permission model (camelCase). `action` is the fixed code contract;
// `label` is the friendly, editable display name shown as a badge.
export interface PermissionModel {
	id: string
	screenId: string
	action: PermissionAction
	label: string
	isSystem: boolean
}

const listSchema = z.object({ permissions: z.array(permissionSchema) })
const oneSchema = z.object({ permission: permissionSchema })

function toModel(p: z.infer<typeof permissionSchema>): PermissionModel {
	return {
		id: p.id,
		screenId: p.screen_id,
		action: p.action,
		label: p.label,
		isSystem: p.is_system,
	}
}

export async function getPermissions(
	screenId?: string,
): Promise<PermissionModel[]> {
	const response = await api.get('/permissions', {
		params: screenId ? { screen_id: screenId } : undefined,
	})
	return listSchema.parse(response.data).permissions.map(toModel)
}

export async function createPermission(
	screenId: string,
	body: CreatePermissionBody,
): Promise<PermissionModel> {
	const response = await api.post(`/screens/${screenId}/permissions`, body)
	return toModel(oneSchema.parse(response.data).permission)
}

export async function updatePermission(
	id: string,
	body: UpdatePermissionBody,
): Promise<PermissionModel> {
	const response = await api.patch(`/permissions/${id}`, body)
	return toModel(oneSchema.parse(response.data).permission)
}

export async function deletePermission(id: string): Promise<void> {
	await api.delete(`/permissions/${id}`)
}
