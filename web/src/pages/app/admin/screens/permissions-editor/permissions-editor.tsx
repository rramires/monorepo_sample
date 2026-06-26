import { PERMISSION_FAMILIES, type PermissionFamily } from '@root/contracts'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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

import { opBadge, usePermissionsEditorPM } from './use-permissions-editor-pm'

// Todo-style permission editor for one screen: add a curated op + friendly
// label, rename a row (unlock → confirm), delete a non-system row (confirm).
export function PermissionsEditor({
	screen,
	trigger,
}: {
	screen: ScreenModel
	trigger: ReactNode
}) {
	const pm = usePermissionsEditorPM(screen.id)
	const { t } = useTranslation(['admin', 'common'])
	const familyLabel = (f: PermissionFamily) =>
		t(`screens.permissions.actions.${f}`)

	return (
		<Dialog open={pm.open} onOpenChange={pm.setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className='sm:max-w-lg'>
				<DialogHeader>
					<DialogTitle>
						{t('screens.permissions.title', { name: screen.name })}
					</DialogTitle>
					<DialogDescription>
						{t('screens.permissions.description')}
					</DialogDescription>
				</DialogHeader>

				{/* Add row */}
				<div className='flex flex-col gap-2'>
					<div className='flex items-end gap-2'>
						<div className='grid gap-1.5'>
							<Label className='text-muted-foreground text-xs'>
								{t('screens.permissions.operationLabel')}
							</Label>
							<Select
								value={pm.op}
								onValueChange={(v) =>
									pm.setOp(v as PermissionFamily | 'other')
								}
							>
								<SelectTrigger className='w-32'>
									<SelectValue
										placeholder={t(
											'screens.permissions.opPlaceholder',
										)}
									/>
								</SelectTrigger>
								<SelectContent>
									{pm.availableFamilies.map((a) => (
										<SelectItem key={a} value={a}>
											{familyLabel(a)}
										</SelectItem>
									))}
									<SelectItem value='other'>
										{t('screens.permissions.other')}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='grid flex-1 gap-1.5'>
							<Label className='text-muted-foreground text-xs'>
								{t('screens.permissions.labelLabel')}
							</Label>
							<Input
								value={pm.newLabel}
								onChange={(e) => pm.setNewLabel(e.target.value)}
								placeholder={t(
									'screens.permissions.labelPlaceholder',
								)}
							/>
						</div>
						<Button
							onClick={pm.add}
							disabled={!pm.canAdd || pm.isAdding}
							aria-label={t('screens.permissions.addAria')}
						>
							<Plus />
						</Button>
					</div>

					{/* Other… → compose a free key from a CRUD family + a name. */}
					{pm.isOther && (
						<div className='flex items-end gap-2'>
							<div className='grid gap-1.5'>
								<Label className='text-muted-foreground text-xs'>
									{t('screens.permissions.familyLabel')}
								</Label>
								<Select
									value={pm.newFamily}
									onValueChange={(v) =>
										pm.setNewFamily(v as PermissionFamily)
									}
								>
									<SelectTrigger className='w-32'>
										<SelectValue
											placeholder={t(
												'screens.permissions.familyPlaceholder',
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										{PERMISSION_FAMILIES.map((f) => (
											<SelectItem key={f} value={f}>
												{familyLabel(f)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='grid flex-1 gap-1.5'>
								<Label className='text-muted-foreground text-xs'>
									{t('screens.permissions.nameLabel')}
								</Label>
								<Input
									value={pm.newName}
									onChange={(e) =>
										pm.setNewName(e.target.value)
									}
									placeholder={t(
										'screens.permissions.namePlaceholder',
									)}
									aria-label={t(
										'screens.permissions.keyNameAria',
									)}
								/>
							</div>
						</div>
					)}
					{pm.isOther && pm.composedKey && (
						<p className='text-muted-foreground font-mono text-xs'>
							→ {pm.composedKey}
						</p>
					)}
				</div>

				{/* List */}
				<div className='flex flex-col gap-2'>
					{pm.isLoading ? (
						<p className='text-muted-foreground text-sm'>
							{t('common:states.loading')}
						</p>
					) : pm.permissions.length === 0 ? (
						<p className='text-muted-foreground text-sm'>
							{t('screens.permissions.empty')}
						</p>
					) : (
						pm.permissions.map((perm) => (
							<div
								key={perm.id}
								className='flex items-center gap-2 rounded-lg border p-2'
							>
								<Badge
									variant='secondary'
									className='justify-center'
								>
									{opBadge(perm.action, familyLabel)}
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
											aria-label={t(
												'screens.permissions.labelAria',
												{ action: perm.action },
											)}
										/>
										<ConfirmDialog
											title={t(
												'screens.permissions.saveDialog.title',
											)}
											description={t(
												'screens.permissions.saveDialog.description',
											)}
											confirmLabel={t(
												'screens.permissions.saveDialog.confirmLabel',
											)}
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
													aria-label={t(
														'screens.permissions.saveAria',
													)}
												>
													<Check />
												</Button>
											}
										/>
										<Button
											size='icon'
											variant='ghost'
											onClick={pm.cancelEdit}
											aria-label={t(
												'screens.permissions.cancelAria',
											)}
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
													{t('common:status.system')}
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
											aria-label={t(
												'screens.permissions.editAria',
												{ label: perm.label },
											)}
										>
											<Pencil />
										</Button>
										{/* System permissions are protected from deletion. */}
										{!perm.isSystem && (
											<ConfirmDialog
												title={t(
													'screens.permissions.delete.title',
												)}
												description={t(
													'screens.permissions.delete.description',
													{ label: perm.label },
												)}
												confirmLabel={t(
													'screens.permissions.delete.confirmLabel',
												)}
												onConfirm={() =>
													pm.remove(perm.id)
												}
												trigger={
													<Button
														size='icon'
														variant='ghost'
														aria-label={t(
															'screens.permissions.deleteAria',
															{
																label: perm.label,
															},
														)}
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
