import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
	title: ReactNode
	// Optional one-liner under the title (muted). Accepts a node so detail pages
	// can pass their own markup (e.g. a mono key).
	description?: ReactNode
	// Optional element before the title (e.g. a back button on detail pages).
	leading?: ReactNode
	// Right-aligned actions (buttons, dialogs). Bottom-aligned to the description
	// baseline via items-end.
	children?: ReactNode
	className?: string
}

// The standard page header: a compact title (logo-sized) + description on the
// left, optional actions on the right. Shared so every page reads the same and
// the title/spacing stay in one place.
export function PageHeader({
	title,
	description,
	leading,
	children,
	className,
}: PageHeaderProps) {
	return (
		<div className={cn('flex items-end justify-between gap-4', className)}>
			<div className='flex items-center gap-2'>
				{leading}
				<div className='space-y-0.5'>
					<h1 className='text-xl font-bold'>{title}</h1>
					{description ? (
						<p className='text-muted-foreground text-sm'>
							{description}
						</p>
					) : null}
				</div>
			</div>
			{children ? (
				<div className='flex shrink-0 items-center gap-2'>
					{children}
				</div>
			) : null}
		</div>
	)
}
