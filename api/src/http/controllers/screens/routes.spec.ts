import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Screens routes (e2e)', () => {
	beforeAll(async () => {
		// running app
		await app.ready()
	})

	afterAll(async () => {
		// shutdown app
		await app.close()
	})

	it('should be able to CRUD a screen', async () => {
		// get admin auth user
		const { token } = await createAndAuthUser(app, true)

		// a screen needs a module to belong to
		const module = await prisma.module.create({
			data: { key: 'test-mod', name: 'Test', order: 0 },
		})

		// create
		const createResponse = await request(app.server)
			.post('/screens')
			.set('Authorization', `Bearer ${token}`)
			.send({
				module_id: module.id,
				key: 'test-mod.screen',
				name: 'Test Screen',
				order: 0,
			})

		expect(createResponse.statusCode).toEqual(201)
		const screenId = createResponse.body.screen.id

		// list
		const listResponse = await request(app.server)
			.get('/screens')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(listResponse.statusCode).toEqual(200)

		// update
		const updateResponse = await request(app.server)
			.patch(`/screens/${screenId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Renamed Screen' })

		expect(updateResponse.statusCode).toEqual(200)

		// delete
		const deleteResponse = await request(app.server)
			.delete(`/screens/${screenId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(deleteResponse.statusCode).toEqual(204)
	})
})
