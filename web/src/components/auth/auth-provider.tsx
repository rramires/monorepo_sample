import { type ReactNode, useEffect, useState } from 'react'

import { getProfile } from '@/api/get-profile'
import { signOut as signOutRequest } from '@/api/sign-out'
import { refreshAccessToken } from '@/lib/api'
import { clearToken, setToken } from '@/lib/auth-store'

import { AuthContext, type AuthStatus, type User } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>('loading')
	const [user, setUser] = useState<User | null>(null)

	// Silent boot: restore the session from the refresh cookie, if any.
	// Uses the single-flight refreshAccessToken (it stores the token itself), so
	// React 18/19 StrictMode firing this effect twice in dev shares ONE refresh
	// call — without it the second call hits an already-rotated single-use cookie,
	// 401s, and logs the user out on F5.
	useEffect(() => {
		async function boot() {
			try {
				await refreshAccessToken()

				const profile = await getProfile()
				setUser(profile)
				setStatus('authed')
			} catch {
				// No valid cookie → just a guest. Silent, no error toast.
				clearToken()
				setUser(null)
				setStatus('guest')
			}
		}

		boot()
	}, [])

	// Called after a successful login: store the token and load the profile.
	async function signIn(token: string) {
		setToken(token)

		try {
			const profile = await getProfile()
			setUser(profile)
			setStatus('authed')
		} catch (err) {
			clearToken()
			setStatus('guest')
			throw err
		}
	}

	async function signOut() {
		try {
			await signOutRequest()
		} finally {
			clearToken()
			setUser(null)
			setStatus('guest')
		}
	}

	// Refetch the profile to pick up server-side changes (e.g. is_verified
	// flips to true after the user verifies their email).
	async function reloadUser() {
		const profile = await getProfile()
		setUser(profile)
	}

	return (
		<AuthContext.Provider
			value={{ status, user, signIn, signOut, reloadUser }}
		>
			{children}
		</AuthContext.Provider>
	)
}
