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

	return (
		<Card>
			<CardHeader>
				<CardTitle>Landing screen</CardTitle>
				<CardDescription>
					Where you land right after signing in.
				</CardDescription>
			</CardHeader>
			<CardContent className='grid gap-2'>
				<Label>Default screen</Label>
				<Select value={pm.value} onValueChange={pm.onSelect}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={pm.automaticValue}>
							Automatic (profile default)
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
