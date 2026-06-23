import { api } from '@/lib/api'

// Self-service: the current user's own username and/or preferred landing
// screen. The backend whitelist is these two only — role/email/is_verified can
// never be set here.
export interface UpdateProfileBody {
	username?: string
	default_screen_key?: string | null
}

export async function updateProfile(body: UpdateProfileBody) {
	await api.patch('/auth/me', body)
}
