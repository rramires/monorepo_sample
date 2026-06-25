import { screen } from '@testing-library/react'
import { type ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { renderWithProviders } from '../../../test/utils'
import { ResponsiveList, type ResponsiveListColumn } from './responsive-list'

type Row = { id: string; name: string; role: string; note: string }

const ROWS: Row[] = [
	{ id: '1', name: 'Ada Lovelace', role: 'ADMIN', note: 'first' },
	{ id: '2', name: 'Linus', role: 'USER', note: 'second' },
]

const COLUMNS: ResponsiveListColumn<Row>[] = [
	{ key: 'name', header: 'Name', cell: (row) => row.name, card: 'top' },
	{ key: 'role', header: 'Role', cell: (row) => row.role, card: 'top' },
	{ key: 'note', header: 'Note', cell: (row) => row.note, card: 'bottom' },
	{
		key: 'actions',
		header: 'Actions',
		cell: () => <button>Edit</button>,
		card: 'actions',
	},
]

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
	})

	it('renders column-driven cards on the tablet band (< lg)', () => {
		setViewport(800)
		renderList(ROWS)

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
		// Columns become "Label:" fields; the actions column renders bare.
		expect(screen.getAllByText('Name:')).toHaveLength(2)
		expect(screen.getAllByText('Note:')).toHaveLength(2)
		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2)
	})

	it('renders cards on the mobile band (< md)', () => {
		setViewport(500)
		renderList(ROWS)

		expect(screen.queryByRole('table')).not.toBeInTheDocument()
		expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2)
	})

	it('shows the empty fallback instead of the list when there are no rows', () => {
		setViewport(1280)
		renderList([], <p>Nothing here</p>)

		expect(screen.getByText('Nothing here')).toBeInTheDocument()
		expect(screen.queryByRole('table')).not.toBeInTheDocument()
	})
})
