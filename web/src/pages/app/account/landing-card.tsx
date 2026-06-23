import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'

import { updateProfile } from '@/api/update-profile'
import { useAppSidebarPM } from '@/components/app-sidebar/use-app-sidebar-pm'
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
import { usePermissions } from '@/hooks/use-permissions'

const AUTOMATIC = 'automatic'

// Lets the user pick which of their screens to land on after login. "Automatic"
// clears the override, falling back to their profile's default screen.
export function LandingCard() {
	const queryClient = useQueryClient()
	const { permissions } = usePermissions()
	const { sections } = useAppSidebarPM()
	const options = sections.flatMap((s) => s.items)

	const save = useMutation({
		mutationFn: (value: string) =>
			updateProfile({
				default_screen_key: value === AUTOMATIC ? null : value,
			}),
		onSuccess: async () => {
			toast.success('Landing screen updated.')
			await queryClient.invalidateQueries({
				queryKey: ['me-permissions'],
			})
		},
		onError: (err) => {
			toast.error(
				(isAxiosError(err) && err.response?.data?.message) ||
					'Could not update the landing screen.',
			)
		},
	})

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
				<Select
					value={permissions?.defaultScreenKey ?? AUTOMATIC}
					onValueChange={(value) => save.mutate(value)}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={AUTOMATIC}>
							Automatic (profile default)
						</SelectItem>
						{options.map((item) => (
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
