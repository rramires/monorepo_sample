import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

// Phones get wider, taller buttons (easier to tap); from md up they return to
// the compact icon size.
const PAGER_BUTTON = 'h-11 w-16 md:h-8 md:w-8'

type PagerProps = {
	canPrev: boolean
	canNext: boolean
	onPrev: () => void
	onNext: () => void
	/** Simple-mode label, when the total is unknown. */
	page?: number
	/**
	 * Full mode: pass `total` + `onFirst`/`onLast` to add the first/last buttons
	 * and a "from–to of total" label (e.g. the search-backed gym list).
	 */
	from?: number
	to?: number
	total?: number
	onFirst?: () => void
	onLast?: () => void
}

export function Pager({
	canPrev,
	canNext,
	onPrev,
	onNext,
	page,
	from,
	to,
	total,
	onFirst,
	onLast,
}: PagerProps) {
	const full = onFirst != null && onLast != null && total != null

	const label = full
		? `${from} to ${to} of ${total}`
		: page != null
			? `Page ${page}`
			: null

	return (
		<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end'>
			{label && (
				<span className='text-muted-foreground text-sm sm:mr-2'>
					{label}
				</span>
			)}
			<div className='flex items-center gap-2'>
				{full && (
					<Button
						variant='outline'
						size='icon'
						className={PAGER_BUTTON}
						onClick={onFirst}
						disabled={!canPrev}
						aria-label='First page'
					>
						<ChevronsLeft />
					</Button>
				)}
				<Button
					variant='outline'
					size='icon'
					className={PAGER_BUTTON}
					onClick={onPrev}
					disabled={!canPrev}
					aria-label='Previous page'
				>
					<ChevronLeft />
				</Button>
				<Button
					variant='outline'
					size='icon'
					className={PAGER_BUTTON}
					onClick={onNext}
					disabled={!canNext}
					aria-label='Next page'
				>
					<ChevronRight />
				</Button>
				{full && (
					<Button
						variant='outline'
						size='icon'
						className={PAGER_BUTTON}
						onClick={onLast}
						disabled={!canNext}
						aria-label='Last page'
					>
						<ChevronsRight />
					</Button>
				)}
			</div>
		</div>
	)
}
