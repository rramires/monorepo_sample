import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Pager } from './pager'

describe('Pager', () => {
	it('simple mode shows the page label and only prev/next', () => {
		render(
			<Pager
				page={3}
				canPrev
				canNext
				onPrev={() => {}}
				onNext={() => {}}
			/>,
		)

		expect(screen.getByText('Page 3')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Previous page' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Next page' }),
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'First page' }),
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: 'Last page' }),
		).not.toBeInTheDocument()
	})

	it('full mode shows the range label and first/last buttons', () => {
		render(
			<Pager
				from={1}
				to={8}
				total={22}
				canPrev={false}
				canNext
				onPrev={() => {}}
				onNext={() => {}}
				onFirst={() => {}}
				onLast={() => {}}
			/>,
		)

		expect(screen.getByText('1 to 8 of 22')).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'First page' }),
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Last page' }),
		).toBeInTheDocument()
	})

	it('disables prev/first when there is no previous page', () => {
		render(
			<Pager
				from={1}
				to={8}
				total={22}
				canPrev={false}
				canNext
				onPrev={() => {}}
				onNext={() => {}}
				onFirst={() => {}}
				onLast={() => {}}
			/>,
		)

		expect(
			screen.getByRole('button', { name: 'Previous page' }),
		).toBeDisabled()
		expect(
			screen.getByRole('button', { name: 'First page' }),
		).toBeDisabled()
		expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
	})

	it('calls the handler when a button is clicked', async () => {
		const user = userEvent.setup()
		const onNext = vi.fn()
		render(
			<Pager
				page={1}
				canPrev={false}
				canNext
				onPrev={() => {}}
				onNext={onNext}
			/>,
		)

		await user.click(screen.getByRole('button', { name: 'Next page' }))
		expect(onNext).toHaveBeenCalledOnce()
	})
})
