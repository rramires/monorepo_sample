import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'

import { createNotice, updateNotice } from '@/api/notices'
import { Button } from '@/components/ui/button'

import { renderWithProviders } from '../../../../test/utils'
import { NoticeDialog } from './notice-dialog'

// Stub na API pra asserir as chamadas sem rede/MSW.
vi.mock('@/api/notices', () => ({
	createNotice: vi.fn(async () => ({})),
	updateNotice: vi.fn(async () => ({})),
}))

beforeEach(() => {
	vi.clearAllMocks()
})

function renderDialog(props: Parameters<typeof NoticeDialog>[0]['notice']) {
	return renderWithProviders(
		<NoticeDialog notice={props} trigger={<Button>Open</Button>} />,
	)
}

describe('NoticeDialog', () => {
	it('cold-loads the stored title and category when editing', async () => {
		const user = userEvent.setup()
		renderDialog({
			id: 'notice-1',
			title: 'Pool closed',
			category: 'warning',
		})

		await user.click(screen.getByRole('button', { name: 'Open' }))

		// O input de título carrega o valor da notícia.
		expect(await screen.findByLabelText('Title')).toHaveValue('Pool closed')
		// O Select (via Controller) tem que carregar a categoria armazenada na
		// abertura — a regressão-âncora de cold-load: vinha vazio e quebrava a validação.
		expect(screen.getByRole('combobox')).toHaveTextContent('Warning')
	})

	it('defaults a new notice to the Info category', async () => {
		const user = userEvent.setup()
		renderWithProviders(<NoticeDialog trigger={<Button>Open</Button>} />)

		await user.click(screen.getByRole('button', { name: 'Open' }))

		expect(await screen.findByLabelText('Title')).toHaveValue('')
		expect(screen.getByRole('combobox')).toHaveTextContent('Info')
	})

	it('requires a title before creating', async () => {
		const user = userEvent.setup()
		renderWithProviders(<NoticeDialog trigger={<Button>Open</Button>} />)

		await user.click(screen.getByRole('button', { name: 'Open' }))
		await user.click(screen.getByRole('button', { name: 'Create notice' }))

		expect(
			await screen.findByText('Title is required.'),
		).toBeInTheDocument()
		expect(createNotice).not.toHaveBeenCalled()
	})

	it('saves an edit with the title and category', async () => {
		const user = userEvent.setup()
		renderDialog({ id: 'notice-1', title: 'Pool closed', category: 'info' })

		await user.click(screen.getByRole('button', { name: 'Open' }))

		const title = await screen.findByLabelText('Title')
		await user.clear(title)
		await user.type(title, 'Pool reopened')
		await user.click(screen.getByRole('button', { name: 'Save changes' }))

		await waitFor(() =>
			expect(updateNotice).toHaveBeenCalledWith('notice-1', {
				title: 'Pool reopened',
				category: 'info',
			}),
		)
	})
})
