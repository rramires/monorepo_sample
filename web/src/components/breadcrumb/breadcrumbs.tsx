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

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{crumbs.map((crumb, index) => {
					const isLast = index === crumbs.length - 1

					return (
						<Fragment key={`${crumb.label}-${index}`}>
							<BreadcrumbItem>
								{isLast || !crumb.to ? (
									<BreadcrumbPage>
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
