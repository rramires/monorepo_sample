import { GlobeCheck, LogOut, UserRoundPen } from 'lucide-react'
import { Link } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from '@/components/ui/sidebar'

import { useAppSidebarPM } from './use-app-sidebar-pm'

export function AppSidebar() {
	const pm = useAppSidebarPM()

	return (
		<Sidebar collapsible='icon'>
			<SidebarHeader>
				<div className='flex items-center gap-2 px-2 py-1'>
					<GlobeCheck className='text-primary size-6 shrink-0' />
					<span className='truncate font-bold group-data-[collapsible=icon]:hidden'>
						Gympass Sample App
					</span>
				</div>
			</SidebarHeader>

			<SidebarContent>
				{pm.sections.map((section) => (
					<SidebarGroup key={section.key}>
						<SidebarGroupLabel>{section.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{section.items.map((item) => (
									<SidebarMenuItem key={item.to}>
										<SidebarMenuButton
											asChild
											isActive={pm.isActive(item.to)}
											tooltip={item.label}
										>
											<Link
												to={item.to}
												onClick={pm.closeMobile}
											>
												<item.icon />
												<span>{item.label}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<div className='flex flex-col gap-2 px-2 py-1 group-data-[collapsible=icon]:hidden'>
					<div className='flex items-center gap-2'>
						<span className='flex-1 truncate text-sm font-medium'>
							{pm.user?.username}
						</span>
						<Badge
							variant={
								pm.user?.role === 'ADMIN'
									? 'default'
									: 'secondary'
							}
						>
							{pm.user?.role === 'ADMIN' ? 'Admin' : 'Member'}
						</Badge>
						{/* Account is self-service — it lives here, next to your
						    identity, not in the gym-domain nav above. */}
						<Button
							asChild
							variant={
								pm.isActive('/account') ? 'secondary' : 'ghost'
							}
							size='icon'
							className='size-7'
						>
							<Link
								to='/account'
								aria-label='Account'
								title='Account'
								onClick={pm.closeMobile}
							>
								<UserRoundPen />
							</Link>
						</Button>
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={pm.handleSignOut}
					>
						<LogOut />
						Sign out
					</Button>
				</div>

				{/* Icon-rail footer: same actions (account, then sign out),
				    icon-only with the standard sidebar tooltip. Shown only when
				    the sidebar is collapsed to the rail. */}
				<SidebarMenu className='hidden group-data-[collapsible=icon]:flex'>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pm.isActive('/account')}
							tooltip='Account'
						>
							<Link
								to='/account'
								aria-label='Account'
								onClick={pm.closeMobile}
							>
								<UserRoundPen />
								<span>Account</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip='Sign out'
							onClick={pm.handleSignOut}
						>
							<LogOut />
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	)
}
