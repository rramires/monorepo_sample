import * as React from 'react'
import { Outlet } from 'react-router'

import { AppSidebar } from '@/components/app-sidebar/app-sidebar'
import { VerifyEmailBanner } from '@/components/auth/verify-email-banner/verify-email-banner'
import { BreadcrumbProvider } from '@/components/breadcrumb/breadcrumb-provider'
import { Breadcrumbs } from '@/components/breadcrumb/breadcrumbs'
import { ModeToggle } from '@/components/theme/mode-toggle'
import { Separator } from '@/components/ui/separator'
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { type LayoutBand, useLayoutBand } from '@/hooks/use-layout-band'

// Tablet opens as an icon rail; mobile/desktop default to an open sidebar
// (mobile's persistent open state is moot — it uses the Sheet drawer).
function bandDefaultOpen(band: LayoutBand) {
	return band !== 'tablet'
}

export function AppLayout() {
	// Band-driven sidebar default. A manual toggle is stored as an override
	// tagged with the band it was made in: it sticks while you stay in that band
	// and is automatically dropped (re-snapping to the band default) the moment
	// the viewport crosses a breakpoint — no effect / render-phase setState.
	const band = useLayoutBand()
	const [override, setOverride] = React.useState<{
		band: LayoutBand
		open: boolean
	} | null>(null)

	const sidebarOpen =
		override && override.band === band
			? override.open
			: bandDefaultOpen(band)

	const handleOpenChange = React.useCallback(
		(open: boolean) => setOverride({ band, open }),
		[band],
	)

	return (
		<TooltipProvider>
			<BreadcrumbProvider>
				<SidebarProvider
					open={sidebarOpen}
					onOpenChange={handleOpenChange}
				>
					<AppSidebar />
					<SidebarInset>
						<header className='flex h-14 shrink-0 items-center gap-2 border-b px-4'>
							<SidebarTrigger />
							<Separator
								orientation='vertical'
								className='mr-1 h-4'
							/>
							<Breadcrumbs />
							<div className='flex-1' />
							<ModeToggle />
						</header>
						<VerifyEmailBanner />
						<div className='flex flex-1 flex-col'>
							<Outlet />
						</div>
					</SidebarInset>
				</SidebarProvider>
			</BreadcrumbProvider>
		</TooltipProvider>
	)
}
