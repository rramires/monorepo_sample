import * as React from 'react'

import { cn } from '@/lib/utils'

/** Two-letter initials from a name/username, for the card avatar. */
function initialsOf(name: string) {
	const parts = name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) {
		return '?'
	}
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase()
	}
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function InitialsAvatar({
	name,
	className,
}: {
	name: string
	className?: string
}) {
	return (
		<span
			aria-hidden
			className={cn(
				'bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium',
				className,
			)}
		>
			{initialsOf(name)}
		</span>
	)
}

type DataCardProps = {
	/** Optional leading avatar (e.g. `<InitialsAvatar />`). */
	avatar?: React.ReactNode
	/** Primary line — bold, truncates. */
	primary: React.ReactNode
	/** Secondary line under the primary — muted, truncates. */
	secondary?: React.ReactNode
	/** Status badges, top-right. */
	badges?: React.ReactNode
	/** Optional extra body between header and footer. */
	children?: React.ReactNode
	/** Footer row — detail on the left, actions on the right. */
	footer?: React.ReactNode
}

/**
 * The BackToYou card recipe — a compact-mode (`< lg`) stand-in for one table
 * row. Header: [avatar?] primary (bold) + secondary (muted) … badges (right).
 * A dashed divider separates an optional footer (detail left, actions right).
 */
export function DataCard({
	avatar,
	primary,
	secondary,
	badges,
	children,
	footer,
}: DataCardProps) {
	return (
		<div className='rounded-md border p-4'>
			<div className='flex items-start gap-3'>
				{avatar}
				<div className='min-w-0 flex-1'>
					<div className='truncate font-medium'>{primary}</div>
					{secondary && (
						<div className='text-muted-foreground truncate text-sm'>
							{secondary}
						</div>
					)}
				</div>
				{badges && (
					<div className='flex shrink-0 flex-wrap items-center justify-end gap-1'>
						{badges}
					</div>
				)}
			</div>

			{children && <div className='mt-3 text-sm'>{children}</div>}

			{footer && (
				<div className='mt-3 flex items-center justify-between gap-2 border-t border-dashed pt-3'>
					{footer}
				</div>
			)}
		</div>
	)
}
