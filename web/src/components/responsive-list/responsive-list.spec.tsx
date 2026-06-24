import { screen } from '@testing-library/react'
import { type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/utils'
import { DataCard, InitialsAvatar } from './data-card'
import { ResponsiveList, type ResponsiveListColumn } from './responsive-list'

type Row = { id: string; name: string; role: string }

const ROWS: Row[] = [
	{ id: '1', name: 'Ada Lovelace', role: 'ADMIN' },
	{ id: '2', name: 'Linus', role: 'USER' },
]

const COLUMNS: ResponsiveListColumn<Row>[] = [
	{ key: 'name', header: 'Name', cell: (row) => row.name },
	{ key: 'role', header: 'Role', cell: (row) => row.role },
]

function renderCard(row: Row) {
	return <div data-testid='card'>{row.name}</div>
}

function setViewport(width: number) {
	Object.defineProperty(window, 'innerWidth', {
		configurable: true,
		writable: true,
		value: width,
	})
}

function renderList(rows: Row[], empty?: ReactNode) {
	return renderWithProviders(
		<ResponsiveList
			rows={rows}
			columns={COLUMNS}
			getRowKey={(row) => row.id}
			renderCard={renderCard}
			empty={empty}
		/>,
	)
}

afterEach(() => {
	setViewport(1024)
})

describe('ResponsiveList', () => {
	it('renders a real table on desktop (≥ lg)', () => {
		setViewport(1280)
		renderList(ROWS)

		expect(screen.getByRole('table')).toBeInTheDocument()
		expect(screen.getByText('Name')).toBeInTheDocument()
		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.queryByTestId('card')).not.toBeInTheDocument()
	})

	it('renders cards on the tablet band (< lg)', () => {
		setViewport(800)
		renderList(ROWS)

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
		expect(screen.getAllByTestId('card')).toHaveLength(2)
		expect(screen.getByText('Linus')).toBeInTheDocument()
	})

	it('renders cards on the mobile band (< md)', () => {
		setViewport(500)
		renderList(ROWS)

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
		expect(screen.getAllByTestId('card')).toHaveLength(2)
	})

	it('shows the empty fallback instead of the list when there are no rows', () => {
		setViewport(1280)
		renderList([], <p>Nothing here</p>)

		expect(screen.getByText('Nothing here')).toBeInTheDocument()
		expect(screen.queryByRole('table')).not.toBeInTheDocument()
	})
})

describe('DataCard', () => {
	it('renders the recipe slots', () => {
		setViewport(800)
		renderWithProviders(
			<DataCard
				primary='Ada'
				secondary='ada@example.com'
				badges={<span>Admin</span>}
				footer={<span>Created today</span>}
			/>,
		)

		expect(screen.getByText('Ada')).toBeInTheDocument()
		expect(screen.getByText('ada@example.com')).toBeInTheDocument()
		expect(screen.getByText('Admin')).toBeInTheDocument()
		expect(screen.getByText('Created today')).toBeInTheDocument()
	})
})

describe('InitialsAvatar', () => {
	it('shows first + last initials for multi-word names', () => {
		renderWithProviders(<InitialsAvatar name='Ada Lovelace' />)
		expect(screen.getByText('AL')).toBeInTheDocument()
	})

	it('shows the first two letters of a single word', () => {
		renderWithProviders(<InitialsAvatar name='admin' />)
		expect(screen.getByText('AD')).toBeInTheDocument()
	})
})
