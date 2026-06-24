import { render, screen } from '@testing-library/react'

import { PageHeader } from './page-header'

describe('PageHeader', () => {
	it('renders the title as a level-1 heading', () => {
		render(<PageHeader title='Screens' />)

		expect(
			screen.getByRole('heading', { level: 1, name: 'Screens' }),
		).toBeInTheDocument()
	})

	it('renders the description when given', () => {
		render(
			<PageHeader title='Screens' description='What grants attach to.' />,
		)

		expect(screen.getByText('What grants attach to.')).toBeInTheDocument()
	})

	it('renders leading content and right-side actions', () => {
		render(
			<PageHeader title='Profiles' leading={<button>Back</button>}>
				<button>New profile</button>
			</PageHeader>,
		)

		expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'New profile' }),
		).toBeInTheDocument()
	})

	it('omits the description paragraph when none is given', () => {
		const { container } = render(<PageHeader title='Users' />)

		expect(container.querySelector('p')).toBeNull()
	})
})
