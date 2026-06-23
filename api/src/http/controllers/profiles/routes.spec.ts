import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Profiles routes (e2e)', () => {
	beforeAll(async () => {
		// running app
		await app.ready()
	})

	afterAll(async () => {
		// shutdown app
		await app.close()
	})

	it('should be able to create, read, edit grants, update and delete a profile', async () => {
		// get auth user (admin bypasses requireScreen)
		const { token } = await createAndAuthUser(app, true)

		// a real module + screen to grant (unique keys per run)
		const moduleRow = await prisma.module.create({
			data: {
				key: `mod-${randomUUID()}`,
				name: 'Test Module',
				order: 0,
			},
		})
		const screenRow = await prisma.screen.create({
			data: {
				module_id: moduleRow.id,
				key: `scr-${randomUUID()}`,
				name: 'Test Screen',
				order: 0,
			},
		})

		// create
		const createResponse = await request(app.server)
			.post('/profiles')
			.set('Authorization', `Bearer ${token}`)
			.send({
				key: `profile-${randomUUID()}`,
				name: 'Test Profile',
				description: 'A profile for tests',
			})

		expect(createResponse.statusCode).toEqual(201)
		const profileId = createResponse.body.profile.id

		// list
		const listResponse = await request(app.server)
			.get('/profiles')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(listResponse.statusCode).toEqual(200)
		expect(Array.isArray(listResponse.body.profiles)).toBe(true)

		// get detail
		const getResponse = await request(app.server)
			.get(`/profiles/${profileId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(getResponse.statusCode).toEqual(200)
		expect(Array.isArray(getResponse.body.screens)).toBe(true)

		// set screens (grants)
		const setScreensResponse = await request(app.server)
			.put(`/profiles/${profileId}/screens`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				screens: [
					{
						screen_id: screenRow.id,
						can_view: true,
						can_create: true,
						can_edit: false,
						can_delete: false,
					},
				],
			})

		expect(setScreensResponse.statusCode).toEqual(200)
		expect(setScreensResponse.body.screens).toHaveLength(1)
		expect(setScreensResponse.body.screens[0].screen_id).toEqual(
			screenRow.id,
		)

		// update
		const updateResponse = await request(app.server)
			.patch(`/profiles/${profileId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Test Profile (renamed)',
			})

		expect(updateResponse.statusCode).toEqual(200)

		// delete
		const deleteResponse = await request(app.server)
			.delete(`/profiles/${profileId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(deleteResponse.statusCode).toEqual(204)
	})
})
