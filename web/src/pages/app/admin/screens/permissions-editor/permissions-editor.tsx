import type { PermissionAction } from '@root/contracts'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import type { ScreenModel } from '@/api/screens'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import {
	ACTION_LABEL,
	usePermissionsEditorPM,
} from './use-permissions-editor-pm'

// Todo-style permission editor for one screen: add a curated op + friendly
// label, rename a row (unlock → confirm), delete a non-system row (confirm).
export function PermissionsEditor({
	screen,
	trigger,
}: {
	screen: ScreenModel
	trigger: ReactNode
}) {
	const [open, setOpen] = useState(false)
	const pm = usePermissionsEditorPM(screen.id, open)
	const noneLeft = pm.availableActions.length === 0

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>Permissions — {screen.name}</DialogTitle>
					<DialogDescription>
						Curate the operations this screen offers and give each a
						friendly label.
					</DialogDescription>
				</DialogHeader>

				{/* Add row */}
				<div className='flex items-end gap-2'>
					<div className='grid gap-1.5'>
						<Label className='text-muted-foreground text-xs'>
							Operation
						</Label>
						<Select
							value={pm.newAction}
							onValueChange={(v) =>
								pm.setNewAction(v as PermissionAction)
							}
							disabled={noneLeft}
						>
							<SelectTrigger className='w-28'>
								<SelectValue placeholder='Op' />
							</SelectTrigger>
							<SelectContent>
								{pm.availableActions.map((a) => (
									<SelectItem key={a} value={a}>
										{ACTION_LABEL[a]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className='grid flex-1 gap-1.5'>
						<Label className='text-muted-foreground text-xs'>
							Label
						</Label>
						<Input
							value={pm.newLabel}
							onChange={(e) => pm.setNewLabel(e.target.value)}
							placeholder='e.g. Check in'
							disabled={noneLeft}
						/>
					</div>
					<Button
						onClick={pm.add}
						disabled={!pm.canAdd || pm.isAdding}
						aria-label='Add permission'
					>
						<Plus />
					</Button>
				</div>
				{noneLeft && (
					<p className='text-muted-foreground text-xs'>
						All operations have been added.
					</p>
				)}

				{/* List */}
				<div className='flex flex-col gap-2'>
					{pm.isLoading ? (
						<p className='text-muted-foreground text-sm'>
							Loading…
						</p>
					) : pm.permissions.length === 0 ? (
						<p className='text-muted-foreground text-sm'>
							No permissions yet — add one above.
						</p>
					) : (
						pm.permissions.map((perm) => (
							<div
								key={perm.id}
								className='flex items-center gap-2 rounded-lg border p-2'
							>
								<Badge
									variant='secondary'
									className='w-16 justify-center'
								>
									{ACTION_LABEL[perm.action]}
								</Badge>

								{pm.editingId === perm.id ? (
									<>
										<Input
											value={pm.draftLabel}
											onChange={(e) =>
												pm.setDraftLabel(e.target.value)
											}
											autoFocus
											className='flex-1'
											aria-label={`${perm.action} label`}
										/>
										<ConfirmDialog
											title='Save permission'
											description='Save changes to this permission?'
											confirmLabel='Save'
											onConfirm={() =>
												pm.saveEdit(perm.id)
											}
											trigger={
												<Button
													size='icon'
													variant='ghost'
													disabled={
														!pm.draftLabel.trim() ||
														pm.isSaving
													}
													aria-label='Save permission'
												>
													<Check />
												</Button>
											}
										/>
										<Button
											size='icon'
											variant='ghost'
											onClick={pm.cancelEdit}
											aria-label='Cancel'
										>
											<X />
										</Button>
									</>
								) : (
									<>
										<span className='flex flex-1 items-center gap-2 text-sm'>
											{perm.label}
											{perm.isSystem && (
												<Badge variant='outline'>
													System
												</Badge>
											)}
										</span>
										<Button
											size='icon'
											variant='ghost'
											onClick={() =>
												pm.startEdit(
													perm.id,
													perm.label,
												)
											}
											aria-label={`Edit ${perm.label}`}
										>
											<Pencil />
										</Button>
										{/* System permissions are protected from deletion. */}
										{!perm.isSystem && (
											<ConfirmDialog
												title='Delete permission'
												description={`Delete "${perm.label}"? Profiles that granted it keep working only if it isn't in use.`}
												confirmLabel='Delete'
												onConfirm={() =>
													pm.remove(perm.id)
												}
												trigger={
													<Button
														size='icon'
														variant='ghost'
														aria-label={`Delete ${perm.label}`}
													>
														<Trash2 />
													</Button>
												}
											/>
										)}
									</>
								)}
							</div>
						))
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
