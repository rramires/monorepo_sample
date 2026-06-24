import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'
import getTestCoordinates from '@/utils/tests/get-test-coordinates'

describe('Nearby Gyms (e2e)', () => {
	beforeAll(async () => {
		// running app
		await app.ready()
	})

	afterAll(async () => {
		// shutdown app
		await app.close()
	})

	it('should be able to list nearby gyms', async () => {
		// get auth user
		const { token } = await createAndAuthUser(app, true)

		// get test positions
		const { coordinates, coordinatesPlus5km, coordinatesPlus10km } =
			getTestCoordinates()

		// create three gyms
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
				latitude: coordinatesPlus5km.lat,
				longitude: coordinatesPlus5km.lon,
			})

		await request(app.server)
			.post('/gyms')
			.set('Authorization', `Bearer ${token}`)
			.send({
				title: 'JavaScript Gym',
				description: 'Best JS Gyn in the city',
				phone: '8888-7777',
				latitude: coordinatesPlus10km.lat,
				longitude: coordinatesPlus10km.lon,
			})

		// an inactive gym at the reference spot must NOT appear (member browse)
		const closed = await request(app.server)
			.post('/gyms')
			.set('Authorization', `Bearer ${token}`)
			.send({
				title: 'Closed Gym',
				description: null,
				phone: null,
				latitude: coordinates.lat,
				longitude: coordinates.lon,
			})
		await request(app.server)
			.patch(`/gyms/${closed.body.gym.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ is_active: false })

		const response = await request(app.server)
			.get('/gyms/nearby')
			.query({
				latitude: coordinates.lat,
				longitude: coordinates.lon,
			})
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(response.statusCode).toEqual(200)
		// Two active gyms within range; the inactive one is excluded.
		expect(response.body.gyms).toHaveLength(2)
		expect(response.body.gyms).toEqual([
			expect.objectContaining({ title: 'TypeScrypt Gym' }),
			expect.objectContaining({ title: 'JavaScript Gym' }),
		])

		// A manager (admin here) may include inactive gyms in nearby.
		const withInactive = await request(app.server)
			.get('/gyms/nearby')
			.query({
				latitude: coordinates.lat,
				longitude: coordinates.lon,
				includeInactive: 'true',
			})
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(withInactive.statusCode).toEqual(200)
		expect(withInactive.body.gyms).toHaveLength(3)
	})
})
