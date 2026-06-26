import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '@/components/ui/chart'
import type { ActivityDay } from '@/lib/check-in-activity'

export function ActivityChart({ data }: { data: ActivityDay[] }) {
	const { t } = useTranslation('check-ins')

	const chartConfig = {
		count: {
			label: t('dashboard.chartLabel'),
			color: 'var(--chart-1)',
		},
	} satisfies ChartConfig

	return (
		<ChartContainer config={chartConfig} className='h-[200px] w-full'>
			<BarChart data={data} accessibilityLayer>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey='label'
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<ChartTooltip content={<ChartTooltipContent />} />
				<Bar dataKey='count' fill='var(--color-count)' radius={4} />
			</BarChart>
		</ChartContainer>
	)
}
