import { setupWorker } from 'msw/browser'

import { env } from '@/env'

import { checkInMock } from './check-in-mock'
import { checkInsHistoryMock } from './check-ins-history-mock'
import { checkInsMetricsMock } from './check-ins-metrics-mock'
import {
	confirmEmailChangeByLinkMock,
	confirmEmailChangeByOtpMock,
} from './confirm-email-change-mock'
import { createGymMock } from './create-gym-mock'
import { forgotPasswordMock } from './forgot-password-mock'
import { getUserMock } from './get-user-mock'
import { getUsersMock } from './get-users-mock'
import { mePermissionsMock } from './me-permissions-mock'
import {
	createModuleMock,
	deleteModuleMock,
	listModulesMock,
	updateModuleMock,
} from './modules-mock'
import { nearbyGymsMock } from './nearby-gyms-mock'
import {
	createPermissionMock,
	deletePermissionMock,
	listPermissionsMock,
	updatePermissionMock,
} from './permissions-mock'
import { profileMock } from './profile-mock'
import {
	createProfileMock,
	deleteProfileMock,
	getProfileMock,
	listProfilesMock,
	setProfileGrantsMock,
	updateProfileEntityMock,
} from './profiles-mock'
import { refreshMock } from './refresh-mock'
import { registerMock } from './register-mock'
import { requestEmailChangeMock } from './request-email-change-mock'
import { resetPasswordMock } from './reset-password-mock'
import {
	createScreenMock,
	deleteScreenMock,
	listScreensMock,
	updateScreenMock,
} from './screens-mock'
import { searchGymsMock } from './search-gyms-mock'
import { sendVerificationMock } from './send-verification-mock'
import { signInMock } from './sign-in-mock'
import { signOutMock } from './sign-out-mock'
import { updateGymMock } from './update-gym-mock'
import { updateProfileMock } from './update-profile-mock'
import { updateUserMock } from './update-user-mock'
import { getUserProfilesMock, setUserProfilesMock } from './user-profiles-mock'
import { validateCheckInMock } from './validate-check-in-mock'
import {
	verifyEmailByLinkMock,
	verifyEmailByOtpMock,
} from './verify-email-mock'

export const worker = setupWorker(
	signInMock,
	registerMock,
	profileMock,
	refreshMock,
	signOutMock,
	forgotPasswordMock,
	resetPasswordMock,
	sendVerificationMock,
	verifyEmailByLinkMock,
	verifyEmailByOtpMock,
	createGymMock,
	nearbyGymsMock,
	searchGymsMock,
	checkInMock,
	checkInsHistoryMock,
	checkInsMetricsMock,
	validateCheckInMock,
	confirmEmailChangeByLinkMock,
	confirmEmailChangeByOtpMock,
	requestEmailChangeMock,
	updateProfileMock,
	// Access control: list/permissions first, then the more specific
	// /users/:id/profiles routes before the generic /users/:id handlers.
	mePermissionsMock,
	listModulesMock,
	createModuleMock,
	updateModuleMock,
	deleteModuleMock,
	listPermissionsMock,
	// The nested /screens/:screenId/permissions create sits before the generic
	// /screens handlers so it isn't shadowed.
	createPermissionMock,
	updatePermissionMock,
	deletePermissionMock,
	listScreensMock,
	createScreenMock,
	updateScreenMock,
	deleteScreenMock,
	listProfilesMock,
	getProfileMock,
	createProfileMock,
	updateProfileEntityMock,
	deleteProfileMock,
	setProfileGrantsMock,
	getUserProfilesMock,
	setUserProfilesMock,
	getUsersMock,
	getUserMock,
	updateUserMock,
	updateGymMock,
)

export async function enableMSW() {
	if (env.MODE !== 'test') {
		return
	}

	await worker.start({
		onUnhandledRequest: 'bypass',
	})
}
