import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Modules routes (e2e)', () => {
	beforeAll(async () => {
		// running app
		await app.ready()
	})

	afterAll(async () => {
		// shutdown app
		await app.close()
	})

	it('should be able to create, list, update and delete a module', async () => {
		// get auth user (admin bypasses requireScreen)
		const { token } = await createAndAuthUser(app, true)

		// create
		const createResponse = await request(app.server)
			.post('/modules')
			.set('Authorization', `Bearer ${token}`)
			.send({
				key: 'reports',
				name: 'Reports',
				description: 'Reporting module',
				order: 1,
			})

		expect(createResponse.statusCode).toEqual(201)
		const moduleId = createResponse.body.module.id

		// list
		const listResponse = await request(app.server)
			.get('/modules')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(listResponse.statusCode).toEqual(200)
		expect(Array.isArray(listResponse.body.modules)).toBe(true)

		// update
		const updateResponse = await request(app.server)
			.patch(`/modules/${moduleId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Reports (renamed)',
			})

		expect(updateResponse.statusCode).toEqual(200)

		// delete
		const deleteResponse = await request(app.server)
			.delete(`/modules/${moduleId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(deleteResponse.statusCode).toEqual(204)
	})
})
