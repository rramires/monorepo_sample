import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Profiles routes (e2e)', () => {
	// Auth once (the helper uses fixed credentials, so a second call would 409
	// on the duplicate user); both tests share the admin token.
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

	it('should be able to create, read, edit grants, update and delete a profile', async () => {
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
		// A curated permission on the screen to grant.
		const permissionRow = await prisma.permission.create({
			data: { screen_id: screenRow.id, action: 'view', label: 'View' },
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

		// set grants (membership + granted permission ids + landing)
		const setScreensResponse = await request(app.server)
			.put(`/profiles/${profileId}/screens`)
			.set('Authorization', `Bearer ${token}`)
			.send({
				screens: [
					{
						screen_id: screenRow.id,
						permission_ids: [permissionRow.id],
					},
				],
				default_screen_id: screenRow.id,
			})

		expect(setScreensResponse.statusCode).toEqual(200)
		expect(setScreensResponse.body.screens).toHaveLength(1)
		expect(setScreensResponse.body.screens[0].screen_id).toEqual(
			screenRow.id,
		)
		expect(setScreensResponse.body.screens[0].permission_ids).toEqual([
			permissionRow.id,
		])
		expect(setScreensResponse.body.default_screen_id).toEqual(screenRow.id)

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

	it('keeps exactly one default profile: promoting demotes the old, the last cannot be removed', async () => {
		const makeProfile = async (is_default: boolean) => {
			const response = await request(app.server)
				.post('/profiles')
				.set('Authorization', `Bearer ${token}`)
				.send({
					key: `profile-${randomUUID()}`,
					name: 'Default test profile',
					is_default,
				})
			expect(response.statusCode).toEqual(201)
			return response.body.profile
		}

		// `a` becomes the default (demoting any pre-existing one); `b` doesn't.
		const a = await makeProfile(true)
		const b = await makeProfile(false)

		// Promote `b` → the radio demotes `a`.
		const promote = await request(app.server)
			.patch(`/profiles/${b.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ is_default: true })
		expect(promote.statusCode).toEqual(200)
		expect(promote.body.profile.is_default).toBe(true)

		const aAfter = await request(app.server)
			.get(`/profiles/${a.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()
		expect(aAfter.body.is_default).toBe(false)

		// Turning the current default off is rejected (would leave zero).
		const removeLast = await request(app.server)
			.patch(`/profiles/${b.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ is_default: false })
		expect(removeLast.statusCode).toEqual(409)
	})

	it('blocks deleting a profile that is still assigned to a user (no cascade)', async () => {
		// A profile assigned to a freshly-created user.
		const profile = await prisma.profile.create({
			data: { key: `profile-${randomUUID()}`, name: 'In-use Profile' },
		})
		const user = await prisma.user.create({
			data: {
				username: `u${randomUUID().slice(0, 8)}`,
				email: `${randomUUID()}@example.com`,
				password_hash: 'x',
			},
		})
		await prisma.userProfile.create({
			data: { user_id: user.id, profile_id: profile.id },
		})

		const response = await request(app.server)
			.delete(`/profiles/${profile.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(409)
		expect(response.body.message).toEqual(
			'Assigned to 1 user(s). Unassign it from those users first.',
		)
	})
})
