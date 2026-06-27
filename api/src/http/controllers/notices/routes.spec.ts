import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Notices routes (e2e)', () => {
	// Autentica uma vez como ADMIN (o `true` cria+autentica um admin; ADMIN bypassa
	// o requireScreen, então as rotas respondem sem grant de seed). Helper de
	// credencial fixa daria 409 numa 2ª chamada — compartilhe o token.
	let token: string

	beforeAll(async () => {
		await app.ready()
		token = (await createAndAuthUser(app, true)).token
	})

	afterAll(async () => {
		await app.close()
	})

	it('should be able to create, list, update and delete a notice', async () => {
		// create
		const createResponse = await request(app.server)
			.post('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Pool closed for maintenance', category: 'warning' })

		expect(createResponse.statusCode).toEqual(201)
		expect(createResponse.body.notice).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				title: 'Pool closed for maintenance',
				category: 'warning',
				created_at: expect.any(String),
			}),
		)
		const noticeId = createResponse.body.notice.id

		// list
		const listResponse = await request(app.server)
			.get('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(listResponse.statusCode).toEqual(200)
		expect(Array.isArray(listResponse.body.notices)).toBe(true)

		// update
		const updateResponse = await request(app.server)
			.patch(`/notices/${noticeId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Pool reopened', category: 'info' })

		expect(updateResponse.statusCode).toEqual(200)
		expect(updateResponse.body.notice.title).toEqual('Pool reopened')
		expect(updateResponse.body.notice.category).toEqual('info')

		// delete
		const deleteResponse = await request(app.server)
			.delete(`/notices/${noticeId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(deleteResponse.statusCode).toEqual(204)
	})

	it('returns 404 updating a non-existent notice', async () => {
		const response = await request(app.server)
			.patch(`/notices/${randomUUID()}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Nope' })

		expect(response.statusCode).toEqual(404)
		expect(response.body.code).toEqual('resource_not_found')
	})

	it('returns 404 deleting a non-existent notice', async () => {
		const response = await request(app.server)
			.delete(`/notices/${randomUUID()}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(404)
		expect(response.body.code).toEqual('resource_not_found')
	})

	it('rejects an invalid category at the body schema (400)', async () => {
		const response = await request(app.server)
			.post('/notices')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Bad', category: 'not-a-category' })

		expect(response.statusCode).toEqual(400)
		expect(response.body.code).toEqual('validation_error')
	})
})
