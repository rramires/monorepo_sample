import { isItemActive } from './use-app-sidebar-pm'

describe('isItemActive', () => {
	it('matches the exact route', () => {
		expect(isItemActive('/gyms', '/gyms')).toBe(true)
		expect(isItemActive('/admin/users', '/admin/users')).toBe(true)
	})

	it('stays active on sub-routes', () => {
		expect(isItemActive('/gyms/new', '/gyms')).toBe(true)
		expect(isItemActive('/admin/users/123', '/admin/users')).toBe(true)
		expect(isItemActive('/admin/profiles/abc', '/admin/profiles')).toBe(
			true,
		)
	})

	it('does not match a sibling that merely shares a prefix', () => {
		expect(isItemActive('/admin/users-archive', '/admin/users')).toBe(false)
		expect(isItemActive('/gyms-foo', '/gyms')).toBe(false)
	})

	it('keeps Dashboard ("/") matching only itself', () => {
		expect(isItemActive('/', '/')).toBe(true)
		expect(isItemActive('/gyms', '/')).toBe(false)
		expect(isItemActive('/admin/users', '/')).toBe(false)
	})

	it('is inactive for an unrelated route', () => {
		expect(isItemActive('/check-ins', '/gyms')).toBe(false)
	})
})
