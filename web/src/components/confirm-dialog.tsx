import { type ReactNode } from 'react'

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

import {
	type ConfirmDialogPMProps,
	useConfirmDialogPM,
} from './use-confirm-dialog-pm'

// Small confirm-then-act dialog.
// - Uncontrolled: pass a `trigger`; clicking it opens the dialog.
// - Controlled: pass `open` + `onOpenChange` (no trigger needed) — used by the
//   confirm-on-deactivate pattern.
export function ConfirmDialog({
	trigger,
	title,
	description,
	confirmLabel = 'Confirm',
	onConfirm,
	open,
	onOpenChange,
}: ConfirmDialogPMProps & {
	trigger?: ReactNode
	title: string
	description: ReactNode
	confirmLabel?: string
}) {
	const pm = useConfirmDialogPM({ onConfirm, open, onOpenChange })

	return (
		<Dialog open={pm.open} onOpenChange={pm.setOpen}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => pm.setOpen(false)}
						disabled={pm.busy}
					>
						Cancel
					</Button>
					<Button
						variant='destructive'
						onClick={pm.handleConfirm}
						disabled={pm.busy}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
