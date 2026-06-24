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

		// ── system screen protection ──────────────────────────────────────────
		// Seed a system screen directly (the API never sets is_system).
		const systemScreen = await prisma.screen.create({
			data: {
				module_id: module.id,
				key: 'access-control.profiles',
				name: 'Profiles',
				order: 0,
				is_system: true,
			},
		})

		// changing its identity (key, module or path) is blocked (409)
		for (const change of [
			{ key: 'renamed' },
			{ module_id: 'some-other-module' },
			{ path: '/somewhere-else' },
		]) {
			const blocked = await request(app.server)
				.patch(`/screens/${systemScreen.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send(change)

			expect(blocked.statusCode).toEqual(409)
		}

		// a name/order edit still works (200)
		const sysEditResponse = await request(app.server)
			.patch(`/screens/${systemScreen.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Profiles (label)', order: 9 })

		expect(sysEditResponse.statusCode).toEqual(200)

		// deleting it is blocked (409)
		const sysDeleteResponse = await request(app.server)
			.delete(`/screens/${systemScreen.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(sysDeleteResponse.statusCode).toEqual(409)
	})
})
