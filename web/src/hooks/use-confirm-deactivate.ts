import { useRef, useState } from 'react'

// Confirm-on-deactivate — the house pattern for soft-delete forms.
//
// Deactivation lives as an Active `Switch` inside an entity's edit form (not a
// separate button). On save, if Active went ON -> OFF, prompt before committing;
// any other edit — or reactivating — saves straight through. Reusable across
// edit forms (users, gyms, …): the PM calls `guardSave` from its submit handler
// and the view renders a controlled `<ConfirmDialog {...dialogProps} …>`.
export function useConfirmDeactivate() {
	const [open, setOpen] = useState(false)
	const pending = useRef<(() => void) | null>(null)

	// Run `save` now, unless Active went true -> false — then stash it and open
	// the confirm dialog (it runs on confirm, is dropped on cancel).
	function guardSave({
		wasActive,
		willBeActive,
		save,
	}: {
		wasActive: boolean
		willBeActive: boolean
		save: () => void
	}) {
		if (wasActive && !willBeActive) {
			pending.current = save
			setOpen(true)
		} else {
			save()
		}
	}

	function confirm() {
		const run = pending.current
		pending.current = null
		run?.()
	}

	// Closing the dialog (Cancel, Esc, backdrop) drops the pending save.
	function onOpenChange(next: boolean) {
		setOpen(next)
		if (!next) {
			pending.current = null
		}
	}

	return {
		guardSave,
		// Spread onto a controlled <ConfirmDialog>; the caller supplies the copy
		// (title/description/confirmLabel) so it fits the entity.
		dialogProps: { open, onOpenChange, onConfirm: confirm },
	}
}
