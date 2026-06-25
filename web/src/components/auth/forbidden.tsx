import { ShieldX } from 'lucide-react'
import { Link } from 'react-router'

import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'

// Shown in place of a gated page. Defaults to the admin-only message; the route
// guard passes the access-specific copy (no view grant vs. killed screen).
export function Forbidden({
	title = '403 — Admins only',
	message = "You don't have access to this page.",
}: {
	title?: string
	message?: string
} = {}) {
	return (
		<>
			<PageTitle title='Forbidden' />

			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
				<ShieldX className='text-muted-foreground size-10' />
				<div>
					<h2 className='text-2xl font-medium'>{title}</h2>
					<p className='text-muted-foreground text-sm'>{message}</p>
				</div>
				<Button asChild>
					<Link to='/'>Back to dashboard</Link>
				</Button>
			</div>
		</>
	)
}
