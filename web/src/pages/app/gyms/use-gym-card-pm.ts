import type { Gym } from '@/api/search-gyms'
import { useCheckIn } from '@/hooks/use-check-in'
import { usePermissions } from '@/hooks/use-permissions'

export function useGymCardPM(gym: Gym) {
	const { handleCheckIn, isCheckingIn } = useCheckIn()
	const { can } = usePermissions()

	return {
		canEdit: can('gym.gyms', 'edit'),
		// Check-in is an extra op of the Gyms screen (composed key), not its own
		// screen — so the button lives here but its grant is gym.gyms.create_checkin.
		canCheckIn: can('gym.gyms', 'create_checkin'),
		isCheckingIn,
		checkIn: () => handleCheckIn(gym.id),
	}
}
