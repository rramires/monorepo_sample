import { randomUUID } from 'node:crypto'

import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { app } from '@/app'
import { prisma } from '@/lib/prisma'
import createAndAuthUser from '@/utils/tests/create-and-auth-user'

describe('Permissions routes (e2e)', () => {
	let token: string

	beforeAll(async () => {
		await app.ready()
		token = (await createAndAuthUser(app, true)).token
	})

	afterAll(async () => {
		await app.close()
	})

	async function makeScreen(is_system = false) {
		const module = await prisma.module.create({
			data: { key: `mod-${randomUUID()}`, name: 'M', order: 0 },
		})
		return prisma.screen.create({
			data: {
				module_id: module.id,
				key: `scr-${randomUUID()}`,
				name: 'S',
				order: 0,
				is_system,
			},
		})
	}

	it('creates, lists, renames and deletes a permission; blocks duplicate actions', async () => {
		const screen = await makeScreen()

		// create
		const create = await request(app.server)
			.post(`/screens/${screen.id}/permissions`)
			.set('Authorization', `Bearer ${token}`)
			.send({ action: 'view', label: 'View' })
		expect(create.statusCode).toEqual(201)
		const permissionId = create.body.permission.id
		expect(create.body.permission.is_system).toBe(false)

		// duplicate action on the same screen → 409
		const dup = await request(app.server)
			.post(`/screens/${screen.id}/permissions`)
			.set('Authorization', `Bearer ${token}`)
			.send({ action: 'view', label: 'See' })
		expect(dup.statusCode).toEqual(409)
		expect(dup.body.message).toEqual(
			'This screen already has a "view" permission.',
		)

		// list (filtered by screen)
		const list = await request(app.server)
			.get('/permissions')
			.query({ screen_id: screen.id })
			.set('Authorization', `Bearer ${token}`)
			.send()
		expect(list.statusCode).toEqual(200)
		expect(list.body.permissions).toHaveLength(1)

		// rename label
		const rename = await request(app.server)
			.patch(`/permissions/${permissionId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ label: 'Look' })
		expect(rename.statusCode).toEqual(200)
		expect(rename.body.permission.label).toEqual('Look')

		// delete (ungranted) → 204
		const del = await request(app.server)
			.delete(`/permissions/${permissionId}`)
			.set('Authorization', `Bearer ${token}`)
			.send()
		expect(del.statusCode).toEqual(204)
	})

	it('protects a system permission from deletion', async () => {
		const screen = await makeScreen(true)
		const permission = await prisma.permission.create({
			data: {
				screen_id: screen.id,
				action: 'view',
				label: 'View',
				is_system: true,
			},
		})

		const del = await request(app.server)
			.delete(`/permissions/${permission.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()
		expect(del.statusCode).toEqual(409)
		expect(del.body.message).toEqual(
			'A system permission cannot be deleted.',
		)
	})

	it('blocks deleting a permission still granted to a profile (no cascade)', async () => {
		const screen = await makeScreen()
		const permission = await prisma.permission.create({
			data: { screen_id: screen.id, action: 'view', label: 'View' },
		})
		const profile = await prisma.profile.create({
			data: { key: `profile-${randomUUID()}`, name: 'P' },
		})
		await prisma.profilePermission.create({
			data: { profile_id: profile.id, permission_id: permission.id },
		})

		const del = await request(app.server)
			.delete(`/permissions/${permission.id}`)
			.set('Authorization', `Bearer ${token}`)
			.send()
		expect(del.statusCode).toEqual(409)
		expect(del.body.message).toEqual(
			'Granted to 1 profile(s). Remove it from those profiles first.',
		)
	})

	it('exposes the menu with the screen kill switch on /me/permissions', async () => {
		const module = await prisma.module.create({
			data: { key: `mod-${randomUUID()}`, name: 'M', order: 0 },
		})
		await prisma.screen.create({
			data: {
				module_id: module.id,
				key: `scr-${randomUUID()}`,
				name: 'S',
				path: '/menu-kill-test',
				order: 0,
			},
		})

		const res = await request(app.server)
			.get('/me/permissions')
			.set('Authorization', `Bearer ${token}`)
			.send()

		expect(res.statusCode).toEqual(200)
		// Admin sees every screen in the menu; each entry carries is_enabled.
		const entry = res.body.menu.find(
			(m: { path: string }) => m.path === '/menu-kill-test',
		)
		expect(entry).toBeDefined()
		expect(entry.is_enabled).toBe(true)
	})
})
