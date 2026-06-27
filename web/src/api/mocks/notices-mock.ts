import {
	createNoticeBodySchema,
	type Notice,
	updateNoticeBodySchema,
} from '@root/contracts'
import { http, HttpResponse } from 'msw'

import { requireAuth } from './mock-auth'

const notices: Notice[] = [
	{
		id: 'notice-1',
		title: 'Welcome to the new gym app',
		category: 'info',
		created_at: '2026-01-10T12:00:00.000Z',
	},
	{
		id: 'notice-2',
		title: 'Pool closed for maintenance',
		category: 'warning',
		created_at: '2026-01-12T09:30:00.000Z',
	},
]
let seq = 0
const nextId = () => `notice-new-${++seq}`

export const listNoticesMock = http.get('/notices', ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}
	return HttpResponse.json({ notices })
})

export const createNoticeMock = http.post('/notices', async ({ request }) => {
	const denied = requireAuth(request.headers.get('Authorization'))
	if (denied) {
		return denied
	}
	const parsed = createNoticeBodySchema.safeParse(await request.json())
	if (!parsed.success) {
		return HttpResponse.json(
			{ code: 'validation_error', message: 'Validation error.' },
			{ status: 400 },
		)
	}
	const notice: Notice = {
		id: nextId(),
		...parsed.data,
		created_at: new Date().toISOString(),
	}
	notices.push(notice)
	return HttpResponse.json({ notice }, { status: 201 })
})

export const updateNoticeMock = http.patch<{ noticeId: string }>(
	'/notices/:noticeId',
	async ({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}
		const notice = notices.find((n) => n.id === params.noticeId)
		if (!notice) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}
		const parsed = updateNoticeBodySchema.safeParse(await request.json())
		if (!parsed.success) {
			return HttpResponse.json(
				{ code: 'validation_error', message: 'Validation error.' },
				{ status: 400 },
			)
		}
		Object.assign(notice, parsed.data)
		return HttpResponse.json({ notice })
	},
)

export const deleteNoticeMock = http.delete<{ noticeId: string }>(
	'/notices/:noticeId',
	({ request, params }) => {
		const denied = requireAuth(request.headers.get('Authorization'))
		if (denied) {
			return denied
		}
		const index = notices.findIndex((n) => n.id === params.noticeId)
		if (index === -1) {
			return HttpResponse.json(
				{ code: 'resource_not_found', message: 'Resource not found.' },
				{ status: 404 },
			)
		}
		notices.splice(index, 1)
		return new HttpResponse(null, { status: 204 })
	},
)
