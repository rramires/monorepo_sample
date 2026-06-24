import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import { Role } from '@/prisma-client/enums'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'
import getTestCoordinates from '@/utils/tests/get-test-coordinates'

// Inline identities — createAndAuthUser hard-codes one user per file.
async function createAdmin(email: string, username: string) {
	const { body } = await request(app.server)
		.post('/users')
		.send({ username, email, password: 'Abc@1234' })
	await prisma.user.update({
		where: { id: body.user.id },
		data: { role: Role.ADMIN },
	})
	const auth = await request(app.server)
		.post('/auth/login')
		.send({ identifier: email, password: 'Abc@1234' })
	return auth.body.token as string
}

async function registerAndAuth(email: string, username: string) {
	await request(app.server)
		.post('/users')
		.send({ username, email, password: 'Abc@1234' })
	const auth = await request(app.server)
		.post('/auth/login')
		.send({ identifier: email, password: 'Abc@1234' })
	return auth.body.token as string
}

describe('Search Gyms (e2e)', () => {
	beforeAll(async () => {
		// running app
		await app.ready()
	})

	afterAll(async () => {
		// shutdown app
		await app.close()
	})

	it('should be able to search gyms by title', async () => {
		// get auth user
		const { token } = await createAndAuthUser(app, true)

		// get test positions
		const { coordinates } = getTestCoordinates()

		// create two gyms
		await request(app.server)
			.post('/gyms')
			.set('Authorization', `Bearer ${token}`)
			.send({
				title: 'TypeScrypt Gym',
				description: 'Best TS Gyn in the city',
				phone: '9999-8888',
				latitude: coordinates.lat,
				longitude: coordinates.lon,
			})

		await request(app.server)
			.post('/gyms')
			.set('Authorization', `Bearer ${token}`)
			.send({
				title: 'JavaScript Gym',
				description: 'Best JS Gyn in the city',
				phone: '8888-7777',
				latitude: coordinates.lat,
				longitude: coordinates.lon,
			})

		const response = await request(app.server)
			.get('/gyms/search')
			.query({
				query: 'JavaScript',
			})
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(200)
		expect(response.body.gyms).toHaveLength(1)
		expect(response.body.total).toEqual(1)
		expect(response.body.gyms).toEqual([
			expect.objectContaining({
				title: 'JavaScript Gym',
			}),
		])
	})

	it('hides inactive gyms from members; a manager can include them', async () => {
		const adminToken = await createAdmin(
			'search-admin@example.com',
			'searchadmin',
		)
		const memberToken = await registerAndAuth(
			'search-member@example.com',
			'searchmember',
		)
		const { coordinates } = getTestCoordinates()

		// one active + one inactive gym sharing a unique title token
		await request(app.server)
			.post('/gyms')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				title: 'Pilates Active',
				description: null,
				phone: null,
				latitude: coordinates.lat,
				longitude: coordinates.lon,
			})
		const closed = await request(app.server)
			.post('/gyms')
			.set('Authorization', `Bearer ${adminToken}`)
			.send({
				title: 'Pilates Closed',
				description: null,
				phone: null,
				latitude: coordinates.lat,
				longitude: coordinates.lon,
			})
		await request(app.server)
			.patch(`/gyms/${closed.body.gym.id}`)
			.set('Authorization', `Bearer ${adminToken}`)
			.send({ is_active: false })

		// member: even asking for inactive, only the active gym comes back
		const memberRes = await request(app.server)
			.get('/gyms/search')
			.query({ query: 'Pilates', includeInactive: 'true' })
			.set('Authorization', `Bearer ${memberToken}`)
			.send()
		expect(memberRes.statusCode).toEqual(200)
		expect(memberRes.body.gyms).toEqual([
			expect.objectContaining({ title: 'Pilates Active' }),
		])

		// manager (admin) with the flag: both gyms
		const adminAll = await request(app.server)
			.get('/gyms/search')
			.query({ query: 'Pilates', includeInactive: 'true' })
			.set('Authorization', `Bearer ${adminToken}`)
			.send()
		expect(adminAll.body.gyms).toHaveLength(2)

		// manager default (no flag): active only
		const adminDefault = await request(app.server)
			.get('/gyms/search')
			.query({ query: 'Pilates' })
			.set('Authorization', `Bearer ${adminToken}`)
			.send()
		expect(adminDefault.body.gyms).toEqual([
			expect.objectContaining({ title: 'Pilates Active' }),
		])
	})
})
