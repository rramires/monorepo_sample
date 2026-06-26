import { fireEvent, screen, within } from '@testing-library/react'
import { useState } from 'react'

import { renderWithProviders } from '../../../test/utils'
import { type TransferColumn, TransferTable } from './index'

interface Row {
	id: string
	name: string
}

const ROWS: Row[] = [
	{ id: '1', name: 'Alpha' },
	{ id: '2', name: 'Bravo' },
	{ id: '3', name: 'Charlie' },
]

const columns: TransferColumn<Row>[] = [
	{ key: 'name', header: 'Name', cell: (r) => r.name },
]

function Harness({ initial = [] as string[] }) {
	const [assigned, setAssigned] = useState<string[]>(initial)
	return (
		<>
			<TransferTable
				items={ROWS}
				getRowId={(r) => r.id}
				assignedIds={assigned}
				onAssignedChange={setAssigned}
				availableColumns={columns}
				assignedColumns={columns}
				labels={{ available: 'Available', assigned: 'Assigned' }}
			/>
			<output data-testid='assigned'>{assigned.join(',')}</output>
		</>
	)
}

describe('TransferTable', () => {
	it('moves all rows right with the move-all button', () => {
		renderWithProviders(<Harness />)

		fireEvent.click(screen.getByLabelText('Move all'))

		expect(screen.getByTestId('assigned')).toHaveTextContent('1,2,3')
	})

	it('moves only the selected row right', () => {
		renderWithProviders(<Harness />)

		// Select "Bravo" (only present on the available side), move selected.
		const bravoRow = screen.getByText('Bravo').closest('tr')!
		fireEvent.click(within(bravoRow).getByLabelText('Select row'))

		fireEvent.click(screen.getByLabelText('Move selected'))

		expect(screen.getByTestId('assigned')).toHaveTextContent('2')
	})

	it('removes an assigned row with move-all-left', () => {
		renderWithProviders(<Harness initial={['1', '2']} />)
		expect(screen.getByTestId('assigned')).toHaveTextContent('1,2')

		fireEvent.click(screen.getByLabelText('Remove all'))

		expect(screen.getByTestId('assigned')).toHaveTextContent('')
	})
})
