import { Fragment } from 'react'
import { Link } from 'react-router'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { useBreadcrumbsPM } from './use-breadcrumbs-pm'

export function Breadcrumbs() {
	const { crumbs } = useBreadcrumbsPM()

	if (crumbs.length === 0) {
		return null
	}

	// A lone crumb (a top-level page) just repeats the page title below it, so
	// mute it — using the same grey as parent links, so it doesn't flicker color
	// when the user drills into a sub-page (Edit/Grants) and it becomes the link.
	const lone = crumbs.length === 1

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{crumbs.map((crumb, index) => {
					const isLast = index === crumbs.length - 1

					return (
						<Fragment key={`${crumb.label}-${index}`}>
							<BreadcrumbItem>
								{isLast || !crumb.to ? (
									<BreadcrumbPage
										className={
											lone
												? 'text-muted-foreground'
												: undefined
										}
									>
										{crumb.label}
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink asChild>
										<Link to={crumb.to}>{crumb.label}</Link>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator />}
						</Fragment>
					)
				})}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
