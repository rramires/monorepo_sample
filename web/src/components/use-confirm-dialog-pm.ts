import { useState } from 'react'

export type ConfirmDialogPMProps = {
	onConfirm: () => Promise<void> | void
	open?: boolean
	onOpenChange?: (open: boolean) => void
}

// Owns the controlled/uncontrolled resolution and the confirm-then-act flow:
// the action runs on confirm; the dialog closes when it resolves and stays
// open (so the error toast is visible) if it throws.
export function useConfirmDialogPM({
	onConfirm,
	open,
	onOpenChange,
}: ConfirmDialogPMProps) {
	const [internalOpen, setInternalOpen] = useState(false)
	const [busy, setBusy] = useState(false)

	const isControlled = open !== undefined
	const actualOpen = isControlled ? open : internalOpen
	const setOpen = isControlled
		? (onOpenChange ?? (() => {}))
		: setInternalOpen

	async function handleConfirm() {
		setBusy(true)
		try {
			await onConfirm()
			setOpen(false)
		} catch {
			// Leave the dialog open; the caller surfaces the error via toast.
		} finally {
			setBusy(false)
		}
	}

	return {
		open: actualOpen,
		setOpen,
		busy,
		handleConfirm,
	}
}
