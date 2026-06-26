import { randomUUID } from 'node:crypto'

import { hash } from 'bcryptjs'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import { Role } from '@/prisma-client/enums'

// Cross-cutting security guarantees from the global pipeline (PROJECT.md §4.1)
// that aren't tied to a single controller: Helmet headers, the hardened refresh
// cookie, JWT expiry, and the strict per-route auth rate limit.
describe('Security hardening (e2e)', () => {
	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	it('sends Helmet security headers on every response', async () => {
		const res = await request(app.server).get('/hello')

		expect(res.headers['x-content-type-options']).toBe('nosniff')
		expect(res.headers['x-frame-options']).toBeDefined()
	})

	it('hardens the refresh cookie (httpOnly + secure + sameSite) on login', async () => {
		const password = 'Abc@1234'
		const email = `${randomUUID()}@example.com`
		await prisma.user.create({
			data: {
				username: `u-${randomUUID().slice(0, 12)}`,
				email,
				password_hash: await hash(password, 6),
				role: Role.USER,
				is_verified: true,
			},
		})

		const res = await request(app.server)
			.post('/auth/login')
			.send({ identifier: email, password })

		expect(res.statusCode).toBe(200)
		const cookies = res.headers['set-cookie'] as unknown as string[]
		const refresh = cookies.find((c) => c.startsWith('refreshToken='))
		expect(refresh).toBeDefined()
		expect(refresh).toMatch(/HttpOnly/i)
		expect(refresh).toMatch(/Secure/i)
		expect(refresh).toMatch(/SameSite=Strict/i)
	})

	it('rejects an expired access token with 401', async () => {
		// Signed by the app's own key but already past its exp → jwtVerify fails.
		const expired = app.jwt.sign(
			{ role: Role.USER, sub: randomUUID(), jti: randomUUID() },
			{ expiresIn: -60 },
		)

		const res = await request(app.server)
			.get('/users')
			.set('Authorization', `Bearer ${expired}`)

		expect(res.statusCode).toBe(401)
	})

	it('throttles every sensitive auth route with the strict 5/min limit (429)', async () => {
		// Each route keeps its own 5/min budget; the 6th hit must be rejected. The
		// limiter is an onRequest hook, so an invalid body still counts.
		const routes = [
			'/users',
			'/users/forgot-password',
			'/users/reset-password',
		]

		for (const route of routes) {
			let lastStatus = 0
			for (let i = 0; i < 6; i++) {
				lastStatus = (await request(app.server).post(route).send({}))
					.statusCode
			}
			expect(lastStatus, `${route} should throttle on the 6th hit`).toBe(
				429,
			)
		}
	})
})
