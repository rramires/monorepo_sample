import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useConfirmDeactivate } from './use-confirm-deactivate'

describe('useConfirmDeactivate', () => {
	it('saves immediately when Active did not change', () => {
		const { result } = renderHook(() => useConfirmDeactivate())
		const save = vi.fn()

		act(() => {
			result.current.guardSave({
				wasActive: true,
				willBeActive: true,
				save,
			})
		})

		expect(save).toHaveBeenCalledTimes(1)
		expect(result.current.dialogProps.open).toBe(false)
	})

	it('saves immediately when reactivating (off -> on)', () => {
		const { result } = renderHook(() => useConfirmDeactivate())
		const save = vi.fn()

		act(() => {
			result.current.guardSave({
				wasActive: false,
				willBeActive: true,
				save,
			})
		})

		expect(save).toHaveBeenCalledTimes(1)
		expect(result.current.dialogProps.open).toBe(false)
	})

	it('prompts and defers the save when deactivating (on -> off)', () => {
		const { result } = renderHook(() => useConfirmDeactivate())
		const save = vi.fn()

		act(() => {
			result.current.guardSave({
				wasActive: true,
				willBeActive: false,
				save,
			})
		})

		expect(result.current.dialogProps.open).toBe(true)
		expect(save).not.toHaveBeenCalled()

		act(() => {
			result.current.dialogProps.onConfirm()
		})

		expect(save).toHaveBeenCalledTimes(1)
	})

	it('drops the pending save when the dialog is cancelled', () => {
		const { result } = renderHook(() => useConfirmDeactivate())
		const save = vi.fn()

		act(() => {
			result.current.guardSave({
				wasActive: true,
				willBeActive: false,
				save,
			})
		})
		act(() => {
			result.current.dialogProps.onOpenChange(false)
		})
		act(() => {
			result.current.dialogProps.onConfirm()
		})

		expect(save).not.toHaveBeenCalled()
		expect(result.current.dialogProps.open).toBe(false)
	})
})
