'use client'

import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react'
import * as React from 'react'

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { Badge } from './badge'

export interface MultiSelectOption {
	value: string
	label: string
}

interface MultiSelectProps {
	options: MultiSelectOption[]
	/** Controlled list of selected values. */
	selected: string[]
	onChange: (values: string[]) => void
	placeholder?: string
	/** Text shown in the dropdown's search box. */
	searchPlaceholder?: string
	/** Text shown when the search matches nothing. */
	emptyText?: string
	disabled?: boolean
	className?: string
}

// A lean multi-select: a popover holding a searchable command list, with the
// chosen options shown as removable chips in the trigger. Controlled via
// selected / onChange. Built on Popover + Command + Badge (no third-party
// multi-select dependency).
export function MultiSelect({
	options,
	selected,
	onChange,
	placeholder = 'Select…',
	searchPlaceholder = 'Search…',
	emptyText = 'No results.',
	disabled,
	className,
}: MultiSelectProps) {
	const [open, setOpen] = React.useState(false)
	const selectedSet = new Set(selected)

	function toggle(value: string) {
		onChange(
			selectedSet.has(value)
				? selected.filter((v) => v !== value)
				: [...selected, value],
		)
	}

	function remove(value: string) {
		onChange(selected.filter((v) => v !== value))
	}

	const selectedOptions = options.filter((o) => selectedSet.has(o.value))

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					role='combobox'
					aria-expanded={open}
					disabled={disabled}
					data-slot='multi-select-trigger'
					className={cn(
						'border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-8 w-full items-center justify-between gap-1.5 rounded-lg border bg-transparent py-1 pr-2 pl-2.5 text-sm transition-colors outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
						className,
					)}
				>
					<span className='flex flex-1 flex-wrap items-center gap-1'>
						{selectedOptions.length === 0 ? (
							<span className='text-muted-foreground'>
								{placeholder}
							</span>
						) : (
							selectedOptions.map((o) => (
								<Badge
									key={o.value}
									variant='secondary'
									className='gap-1'
								>
									{o.label}
									<span
										role='button'
										tabIndex={-1}
										aria-label={`Remove ${o.label}`}
										className='hover:text-foreground -mr-0.5 cursor-pointer rounded-full opacity-70 transition-opacity hover:opacity-100'
										onPointerDown={(e) => {
											e.preventDefault()
											e.stopPropagation()
											remove(o.value)
										}}
									>
										<XIcon className='size-3' />
									</span>
								</Badge>
							))
						)}
					</span>
					<ChevronsUpDownIcon className='text-muted-foreground size-4 shrink-0 opacity-50' />
				</button>
			</PopoverTrigger>
			<PopoverContent
				className='w-(--radix-popover-trigger-width) p-0'
				align='start'
			>
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>
						<CommandGroup>
							{options.map((o) => {
								const isSelected = selectedSet.has(o.value)
								return (
									<CommandItem
										key={o.value}
										value={o.label}
										keywords={[o.value]}
										onSelect={() => toggle(o.value)}
									>
										<CheckIcon
											className={cn(
												'size-4',
												isSelected
													? 'opacity-100'
													: 'opacity-0',
											)}
										/>
										{o.label}
									</CommandItem>
								)
							})}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
