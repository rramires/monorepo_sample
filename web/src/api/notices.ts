import {
	type CreateNoticeBody,
	type NoticeCategory,
	noticeSchema,
	type UpdateNoticeBody,
} from '@root/contracts'
import { z } from 'zod'

import { api } from '@/lib/api'

// Modelo do app (camelCase). O wire (snake_case) não passa daqui.
export interface NoticeModel {
	id: string
	title: string
	category: NoticeCategory
	createdAt: string
}

const listSchema = z.object({ notices: z.array(noticeSchema) })
const oneSchema = z.object({ notice: noticeSchema })

function toModel(n: z.infer<typeof noticeSchema>): NoticeModel {
	return {
		id: n.id,
		title: n.title,
		category: n.category,
		createdAt: n.created_at,
	}
}

export async function listNotices(): Promise<NoticeModel[]> {
	const response = await api.get('/notices')
	return listSchema.parse(response.data).notices.map(toModel)
}

export async function createNotice(
	body: CreateNoticeBody,
): Promise<NoticeModel> {
	const response = await api.post('/notices', body)
	return toModel(oneSchema.parse(response.data).notice)
}

export async function updateNotice(
	id: string,
	body: UpdateNoticeBody,
): Promise<NoticeModel> {
	const response = await api.patch(`/notices/${id}`, body)
	return toModel(oneSchema.parse(response.data).notice)
}

export async function deleteNotice(id: string): Promise<void> {
	await api.delete(`/notices/${id}`)
}
