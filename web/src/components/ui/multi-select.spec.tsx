import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../test/utils'
import { MultiSelect, type MultiSelectOption } from './multi-select'

const OPTIONS: MultiSelectOption[] = [
	{ value: 'gym', label: 'Gym' },
	{ value: 'access-control', label: 'Access Control' },
	{ value: 'billing', label: 'Billing' },
]

// happy-dom lacks the pointer-capture / scroll APIs Radix Popover + cmdk touch.
beforeAll(() => {
	const proto = Element.prototype as unknown as Record<string, unknown>
	proto.hasPointerCapture ??= () => false
	proto.setPointerCapture ??= () => {}
	proto.releasePointerCapture ??= () => {}
	proto.scrollIntoView ??= () => {}
})

// A stateful host so interactions reflect back into the controlled component.
function Harness({ initial = [] as string[] }) {
	const [selected, setSelected] = useState(initial)
	return (
		<MultiSelect
			options={OPTIONS}
			selected={selected}
			onChange={setSelected}
		/>
	)
}

describe('MultiSelect', () => {
	it('shows the placeholder when nothing is selected', () => {
		renderWithProviders(
			<MultiSelect
				options={OPTIONS}
				selected={[]}
				onChange={() => {}}
				placeholder='Filter by module'
			/>,
		)

		expect(screen.getByText('Filter by module')).toBeInTheDocument()
	})

	it('renders a chip per selected option', () => {
		renderWithProviders(
			<MultiSelect
				options={OPTIONS}
				selected={['gym', 'billing']}
				onChange={() => {}}
			/>,
		)

		expect(screen.getByText('Gym')).toBeInTheDocument()
		expect(screen.getByText('Billing')).toBeInTheDocument()
		expect(screen.queryByText('Access Control')).not.toBeInTheDocument()
	})

	it('removes a value when its chip X is clicked', async () => {
		const user = userEvent.setup()
		const onChange = vi.fn()
		renderWithProviders(
			<MultiSelect
				options={OPTIONS}
				selected={['gym', 'billing']}
				onChange={onChange}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Remove Gym' }))

		expect(onChange).toHaveBeenCalledWith(['billing'])
	})

	it('adds an option picked from the open list', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Harness />)

		await user.click(screen.getByRole('combobox'))
		await user.click(await screen.findByText('Access Control'))

		// The chip now appears in the trigger.
		expect(
			screen.getByRole('button', { name: 'Remove Access Control' }),
		).toBeInTheDocument()
	})

	it('deselects an already-selected option from the list', async () => {
		const user = userEvent.setup()
		renderWithProviders(<Harness initial={['gym']} />)

		await user.click(screen.getByRole('combobox'))
		// Two "Gym" texts now: the chip and the list item — click the list item.
		const listItem = screen
			.getAllByText('Gym')
			.find((el) => el.closest('[data-slot="command-item"]'))
		await user.click(listItem!)

		expect(
			screen.queryByRole('button', { name: 'Remove Gym' }),
		).not.toBeInTheDocument()
	})
})
