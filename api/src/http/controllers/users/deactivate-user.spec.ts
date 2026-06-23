import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Deactivate user (e2e)', () => {
	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	it('cuts off the user immediately and blocks re-login', async () => {
		// Admin who will deactivate someone (also seeds access-control.users grant
		// via ADMIN bypass).
		const { token: adminToken, user: admin } = await createAndAuthUser(
			app,
			true,
		)

		// An admin can't deactivate their own account.
		const self = await request(app.server)
			.patch(`/users/${admin.id}`)
			.set('Authorization', `Bearer ${adminToken}`)
			.send({ is_active: false })
		expect(self.statusCode).toEqual(400)

		// A separate target member.
		const target = {
			username: 'targetuser',
			email: 'target@example.com',
			password: 'Abc@1234',
		}
		const created = await request(app.server).post('/users').send(target)
		const targetId = created.body.user.id

		const login = await request(app.server)
			.post('/auth/login')
			.send({ identifier: target.email, password: target.password })
		const memberToken = login.body.token

		// The member can reach an authed route while active.
		const before = await request(app.server)
			.get('/auth/me')
			.set('Authorization', `Bearer ${memberToken}`)
		expect(before.statusCode).toEqual(200)

		// Admin deactivates the member.
		const patch = await request(app.server)
			.patch(`/users/${targetId}`)
			.set('Authorization', `Bearer ${adminToken}`)
			.send({ is_active: false })
		expect(patch.statusCode).toEqual(200)

		// The existing token is rejected on the very next request.
		const after = await request(app.server)
			.get('/auth/me')
			.set('Authorization', `Bearer ${memberToken}`)
		expect(after.statusCode).toEqual(401)

		// And the member can no longer sign in.
		const reLogin = await request(app.server)
			.post('/auth/login')
			.send({ identifier: target.email, password: target.password })
		expect(reLogin.statusCode).toEqual(403)
	})
})
