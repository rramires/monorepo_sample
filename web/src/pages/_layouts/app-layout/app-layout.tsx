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

import { useAppLayoutPM } from './use-app-layout-pm'

export function AppLayout() {
	const pm = useAppLayoutPM()

	return (
		<TooltipProvider>
			<BreadcrumbProvider>
				<SidebarProvider
					open={pm.sidebarOpen}
					onOpenChange={pm.onOpenChange}
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
