import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Modules routes (e2e)', () => {
	// Auth once (fixed-credential helper would 409 on a second call); share it.
	let token: string

	beforeAll(async () => {
		// running app
		await app.ready()
		token = (await createAndAuthUser(app, true)).token
	})

	afterAll(async () => {
		// shutdown app
		await app.close()
	})

	it('should be able to create, list, update and delete a module', async () => {
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

		// ── system module protection ──────────────────────────────────────────
		// Seed a system module directly (the API never sets is_system).
		const systemModule = await prisma.module.create({
			data: {
				key: 'access-control',
				name: 'Access Control',
				order: 0,
				is_system: true,
			},
		})

		// renaming its key is blocked (409)
		const sysRenameResponse = await request(app.server)
			.patch(`/modules/${systemModule.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ key: 'renamed' })

		expect(sysRenameResponse.statusCode).toEqual(409)

		// a non-key edit still works (200)
		const sysEditResponse = await request(app.server)
			.patch(`/modules/${systemModule.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ name: 'Access Control (label)' })

		expect(sysEditResponse.statusCode).toEqual(200)

		// deleting it is blocked (409)
		const sysDeleteResponse = await request(app.server)
			.delete(`/modules/${systemModule.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(sysDeleteResponse.statusCode).toEqual(409)
	})

	it('blocks deleting a module that still has screens (no cascade)', async () => {
		const module = await prisma.module.create({
			data: { key: `mod-${Date.now()}`, name: 'M', order: 0 },
		})
		await prisma.screen.create({
			data: {
				module_id: module.id,
				key: `scr-${Date.now()}`,
				name: 'S',
				order: 0,
			},
		})

		const response = await request(app.server)
			.delete(`/modules/${module.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(409)
		expect(response.body.message).toEqual('Module still has screens.')
	})
})
