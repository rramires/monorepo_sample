import { useTranslation } from 'react-i18next'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

import { useLandingCardPM } from './use-landing-card-pm'

export function LandingCard() {
	const pm = useLandingCardPM()
	const { t } = useTranslation('account')

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t('landing.title')}</CardTitle>
				<CardDescription>{t('landing.description')}</CardDescription>
			</CardHeader>
			<CardContent className='grid gap-2'>
				<Label>{t('landing.label')}</Label>
				<Select value={pm.value} onValueChange={pm.onSelect}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={pm.automaticValue}>
							{t('landing.automatic')}
						</SelectItem>
						{pm.options.map((item) => (
							<SelectItem key={item.key} value={item.key}>
								{item.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</CardContent>
		</Card>
	)
}
