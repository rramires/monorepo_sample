import { z } from 'zod'

// `category` é um enum compartilhado: o Select do form, o mock e o backend
// validam todos contra a mesma fonte de verdade.
export const noticeCategorySchema = z.enum(['info', 'warning', 'urgent'])
export type NoticeCategory = z.infer<typeof noticeCategorySchema>

export const noticeSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	category: noticeCategorySchema,
	created_at: z.string(), // ISO; o Prisma serializa Date → string no JSON
})
export type Notice = z.infer<typeof noticeSchema>

// POST /notices — create.
export const createNoticeBodySchema = z.object({
	title: z.string().min(1),
	category: noticeCategorySchema,
})
export type CreateNoticeBody = z.infer<typeof createNoticeBodySchema>

// PATCH /notices/:noticeId — update; todo campo opcional.
export const updateNoticeBodySchema = createNoticeBodySchema.partial()
export type UpdateNoticeBody = z.infer<typeof updateNoticeBodySchema>