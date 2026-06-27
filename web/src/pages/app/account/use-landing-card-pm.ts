import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { updateProfile } from '@/api/update-profile'
import { useAppSidebarPM } from '@/components/app-sidebar/use-app-sidebar-pm'
import { usePermissions } from '@/hooks/use-permissions'
import { messageFromError } from '@/lib/errors'

const AUTOMATIC = 'automatic'

// Lets the user pick which of their screens to land on after login. "Automatic"
// clears the override, falling back to their profile's default screen.
export function useLandingCardPM() {
	const queryClient = useQueryClient()
	const { t } = useTranslation('account')
	const { permissions } = usePermissions()
	const { sections } = useAppSidebarPM()
	const options = sections.flatMap((s) => s.items)

	const save = useMutation({
		mutationFn: (value: string) =>
			updateProfile({
				default_screen_key: value === AUTOMATIC ? null : value,
			}),
		onSuccess: async () => {
			toast.success(t('landing.toast.success'))
			await queryClient.invalidateQueries({
				queryKey: ['me-permissions'],
			})
		},
		onError: (err) => {
			toast.error(messageFromError(err, t('landing.toast.error')))
		},
	})

	return {
		automaticValue: AUTOMATIC,
		value: permissions?.defaultScreenKey ?? AUTOMATIC,
		options,
		onSelect: (value: string) => save.mutate(value),
	}
}
