import { afterEach, expect, it, vi } from 'vitest'

import { api, refreshAccessToken } from '@/lib/api'
import { clearToken } from '@/lib/auth-store'

afterEach(() => {
	vi.restoreAllMocks()
	clearToken()
})

// The boot effect relies on this: under React StrictMode it runs twice in dev,
// firing two refreshes against a single-use rotating cookie. Single-flight makes
// the concurrent callers share ONE network call, so the second never 401s.
it('single-flight: concurrent refreshes share one network call', async () => {
	const patch = vi
		.spyOn(api, 'patch')
		.mockResolvedValue({ data: { token: 'tok' } } as never)

	const tokens = await Promise.all([
		refreshAccessToken(),
		refreshAccessToken(),
		refreshAccessToken(),
	])

	expect(patch).toHaveBeenCalledTimes(1)
	expect(tokens).toEqual(['tok', 'tok', 'tok'])
})

// Once the in-flight call settles, the gate resets so a later refresh runs again.
it('refreshes again once the in-flight call settled', async () => {
	const patch = vi
		.spyOn(api, 'patch')
		.mockResolvedValue({ data: { token: 'tok' } } as never)

	await refreshAccessToken()
	await refreshAccessToken()

	expect(patch).toHaveBeenCalledTimes(2)
})
