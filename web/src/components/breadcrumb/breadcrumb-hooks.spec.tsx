import { render, screen } from '@testing-library/react'

import { useBreadcrumb, useSetBreadcrumb } from './breadcrumb-hooks'
import { BreadcrumbProvider } from './breadcrumb-provider'

function Publisher({ label }: { label: string | null | undefined }) {
	useSetBreadcrumb(label)
	return null
}

function Reader() {
	const { label } = useBreadcrumb()
	return <span data-testid='label'>{label ?? 'none'}</span>
}

describe('useSetBreadcrumb', () => {
	it('publishes the label into context', () => {
		render(
			<BreadcrumbProvider>
				<Publisher label='Gym Member' />
				<Reader />
			</BreadcrumbProvider>,
		)

		expect(screen.getByTestId('label')).toHaveTextContent('Gym Member')
	})

	it('clears the label when the publisher unmounts', () => {
		function Harness({ show }: { show: boolean }) {
			return (
				<BreadcrumbProvider>
					{show && <Publisher label='Gym Member' />}
					<Reader />
				</BreadcrumbProvider>
			)
		}

		const { rerender } = render(<Harness show />)
		expect(screen.getByTestId('label')).toHaveTextContent('Gym Member')

		rerender(<Harness show={false} />)
		expect(screen.getByTestId('label')).toHaveTextContent('none')
	})

	it('treats undefined (still loading) as no crumb', () => {
		render(
			<BreadcrumbProvider>
				<Publisher label={undefined} />
				<Reader />
			</BreadcrumbProvider>,
		)

		expect(screen.getByTestId('label')).toHaveTextContent('none')
	})
})
