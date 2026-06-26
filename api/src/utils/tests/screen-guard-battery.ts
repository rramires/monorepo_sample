import { randomUUID } from 'node:crypto'

import { hash } from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { prisma } from '@/lib/prisma'
import { Role } from '@/prisma-client/enums'

// Reusable e2e battery for the `requireScreen` authorization guard. It seeds a
// catalog + three callers (granted USER, ungranted USER, ADMIN) and asserts the
// full security matrix on every guarded route — proving a screen's grant AND its
// kill switch (`is_enabled`) are enforced fresh from the DB on EVERY route, not
// just the mutations. `requireScreen` is an `onRequest` hook (runs before body
// validation), so the battery never needs valid bodies/targets: a passing guard
// simply means "not 401/403" (the controller may then 400/404).

export interface GuardScreenSpec {
	key: string
	path: string
	actions: string[]
}

// [method, path, screenKey, action] — path params can be any placeholder; the
// guard runs before the route handler resolves them.
export type GuardRoute = [string, string, string, string]

export interface GuardFixtures {
	grantedToken: string
	nobodyToken: string
	adminToken: string
	setEnabled: (key: string, isEnabled: boolean) => Promise<void>
}

// Seed the catalog + callers for the given screens. A single "granted" profile
// is a MEMBER of every screen and is granted EVERY listed action; the granted
// user holds it. The "nobody" user holds nothing; the admin bypasses by role.
// All users are verified so the email gate never masks an authorization result.
export async function seedScreenGuardFixtures(
	app: FastifyInstance,
	screens: GuardScreenSpec[],
): Promise<GuardFixtures> {
	const password = 'Abc@1234'
	const password_hash = await hash(password, 6)

	const moduleRow = await prisma.module.create({
		data: { key: `mod-${randomUUID()}`, name: 'Guard', order: 0 },
	})
	const profile = await prisma.profile.create({
		data: { key: `prof-${randomUUID()}`, name: 'Granted' },
	})

	for (const spec of screens) {
		const screen = await prisma.screen.create({
			data: {
				module_id: moduleRow.id,
				key: spec.key,
				name: spec.key,
				path: spec.path,
				order: 0,
			},
		})
		// Membership — required for the kill switch to reach this screen (the
		// `is_enabled` check reads the user's menu, which is membership-built).
		await prisma.profileScreen.create({
			data: { profile_id: profile.id, screen_id: screen.id },
		})
		for (const action of spec.actions) {
			const permission = await prisma.permission.create({
				data: { screen_id: screen.id, action, label: action },
			})
			await prisma.profilePermission.create({
				data: {
					profile_id: profile.id,
					permission_id: permission.id,
				},
			})
		}
	}

	async function makeUser(role: Role, withProfile: boolean): Promise<string> {
		const user = await prisma.user.create({
			data: {
				username: `u-${randomUUID().slice(0, 12)}`,
				email: `${randomUUID()}@example.com`,
				password_hash,
				role,
				is_verified: true,
			},
		})
		if (withProfile) {
			await prisma.userProfile.create({
				data: { user_id: user.id, profile_id: profile.id },
			})
		}
		const auth = await request(app.server)
			.post('/auth/login')
			.send({ identifier: user.email, password })
		return auth.body.token as string
	}

	return {
		grantedToken: await makeUser(Role.USER, true),
		nobodyToken: await makeUser(Role.USER, false),
		adminToken: await makeUser(Role.ADMIN, false),
		setEnabled: async (key, isEnabled) => {
			await prisma.screen.update({
				where: { key },
				data: { is_enabled: isEnabled },
			})
		},
	}
}

function call(
	app: FastifyInstance,
	method: string,
	path: string,
	token?: string,
): request.Test {
	const agent = request(app.server)
	let req: request.Test
	switch (method) {
		case 'GET':
			req = agent.get(path)
			break
		case 'POST':
			req = agent.post(path)
			break
		case 'PATCH':
			req = agent.patch(path)
			break
		case 'PUT':
			req = agent.put(path)
			break
		case 'DELETE':
			req = agent.delete(path)
			break
		default:
			throw new Error(`Unsupported method ${method}`)
	}
	return token ? req.set('Authorization', `Bearer ${token}`) : req
}

// Register the per-route security matrix. `fixtures()` is a getter so the tokens
// (filled in the file's beforeAll) are read lazily at run time.
export function runScreenGuardBattery(
	app: FastifyInstance,
	routes: GuardRoute[],
	fixtures: () => GuardFixtures,
): void {
	for (const [method, path, screen, action] of routes) {
		describe(`${method} ${path} → requireScreen('${screen}','${action}')`, () => {
			it('401 without a token', async () => {
				const res = await call(app, method, path)
				expect(res.statusCode).toBe(401)
			})

			it('403 Forbidden without the grant', async () => {
				const res = await call(
					app,
					method,
					path,
					fixtures().nobodyToken,
				)
				expect(res.statusCode).toBe(403)
				expect(res.body.message).toBe('Forbidden.')
			})

			it('403 temporarily unavailable when the screen is killed', async () => {
				await fixtures().setEnabled(screen, false)
				const res = await call(
					app,
					method,
					path,
					fixtures().grantedToken,
				)
				await fixtures().setEnabled(screen, true)
				expect(res.statusCode).toBe(403)
				expect(res.body.message).toBe(
					'This screen is temporarily unavailable.',
				)
			})

			it('passes the guard when granted and the screen is enabled', async () => {
				const res = await call(
					app,
					method,
					path,
					fixtures().grantedToken,
				)
				expect([401, 403]).not.toContain(res.statusCode)
			})

			it('ADMIN bypasses even a killed screen', async () => {
				await fixtures().setEnabled(screen, false)
				const res = await call(app, method, path, fixtures().adminToken)
				await fixtures().setEnabled(screen, true)
				expect([401, 403]).not.toContain(res.statusCode)
			})
		})
	}
}
