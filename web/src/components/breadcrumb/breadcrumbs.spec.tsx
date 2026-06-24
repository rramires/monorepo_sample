import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../test/utils'
import { useSetBreadcrumb } from './breadcrumb-hooks'
import { BreadcrumbProvider } from './breadcrumb-provider'
import { Breadcrumbs } from './breadcrumbs'

function Publisher({ label }: { label: string }) {
	useSetBreadcrumb(label)
	return null
}

describe('Breadcrumbs', () => {
	it('renders a single current crumb for a top-level route', () => {
		// BreadcrumbPage carries role="link" (a disabled link), so assert on the
		// anchor element to tell a navigable crumb from the current page.
		const { container } = renderWithProviders(
			<BreadcrumbProvider>
				<Breadcrumbs />
			</BreadcrumbProvider>,
			{ route: '/gyms' },
		)

		expect(screen.getByText('Gyms')).toHaveAttribute('aria-current', 'page')
		expect(container.querySelector('a')).toBeNull()
		// A lone crumb is muted (it just repeats the page title below it).
		expect(screen.getByText('Gyms')).toHaveClass('text-muted-foreground')
	})

	it('links the section and marks the leaf as current on a nested route', () => {
		renderWithProviders(
			<BreadcrumbProvider>
				<Breadcrumbs />
			</BreadcrumbProvider>,
			{ route: '/gyms/new' },
		)

		expect(screen.getByRole('link', { name: 'Gyms' })).toHaveAttribute(
			'href',
			'/gyms',
		)
		const leaf = screen.getByText('New gym')
		expect(leaf).toHaveAttribute('aria-current', 'page')
		// The leaf of a multi-crumb trail keeps the foreground (not muted).
		expect(leaf).not.toHaveClass('text-muted-foreground')
	})

	it('falls back to the section noun while a dynamic entity loads', () => {
		renderWithProviders(
			<BreadcrumbProvider>
				<Breadcrumbs />
			</BreadcrumbProvider>,
			{ route: '/admin/profiles/abc123' },
		)

		expect(screen.getByRole('link', { name: 'Profiles' })).toHaveAttribute(
			'href',
			'/admin/profiles',
		)
		expect(screen.getByText('Profile')).toHaveAttribute(
			'aria-current',
			'page',
		)
	})

	it('uses the published label as the dynamic leaf', () => {
		renderWithProviders(
			<BreadcrumbProvider>
				<Publisher label='Gym Member' />
				<Breadcrumbs />
			</BreadcrumbProvider>,
			{ route: '/admin/profiles/abc123' },
		)

		expect(
			screen.getByRole('link', { name: 'Profiles' }),
		).toBeInTheDocument()
		expect(screen.getByText('Gym Member')).toHaveAttribute(
			'aria-current',
			'page',
		)
	})

	it('renders nothing for an unmapped route', () => {
		const { container } = renderWithProviders(
			<BreadcrumbProvider>
				<Breadcrumbs />
			</BreadcrumbProvider>,
			{ route: '/totally/unknown' },
		)

		expect(container).toBeEmptyDOMElement()
	})
})
