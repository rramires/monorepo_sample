import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'

// Small confirm-then-act dialog. The action runs on confirm; the dialog closes
// when it resolves and stays open (so the error toast is visible) if it throws.
//
// Two modes:
// - **Uncontrolled** (pass a `trigger`): clicking it opens the dialog.
// - **Controlled** (pass `open` + `onOpenChange`, no trigger needed): the caller
//   opens it programmatically — used by the confirm-on-deactivate pattern.
export function ConfirmDialog({
	trigger,
	title,
	description,
	confirmLabel = 'Confirm',
	onConfirm,
	open,
	onOpenChange,
}: {
	trigger?: ReactNode
	title: string
	description: ReactNode
	confirmLabel?: string
	onConfirm: () => Promise<void> | void
	open?: boolean
	onOpenChange?: (open: boolean) => void
}) {
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

	return (
		<Dialog open={actualOpen} onOpenChange={setOpen}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => setOpen(false)}
						disabled={busy}
					>
						Cancel
					</Button>
					<Button
						variant='destructive'
						onClick={handleConfirm}
						disabled={busy}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
