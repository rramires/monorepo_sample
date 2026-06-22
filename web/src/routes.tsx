import { createBrowserRouter } from 'react-router'

import { ProtectedRoute } from './components/auth/protected-route'
import { RequireScreen } from './components/auth/require-screen'
import { AppLayout } from './pages/_layouts/app-layout/app-layout'
import { AuthLayout } from './pages/_layouts/auth-layout'
import { RegisterLayout } from './pages/_layouts/register-layout'
import { Account } from './pages/app/account/account'
import { UserEdit } from './pages/app/admin/users/user-edit/user-edit'
import { AdminUsers } from './pages/app/admin/users/users'
import { CheckIns } from './pages/app/check-ins/check-ins'
import { Gyms } from './pages/app/gyms/gyms'
import { Home } from './pages/app/home/home'
import { NewGym } from './pages/app/new-gym/new-gym'
import { ConfirmEmailChange } from './pages/auth/confirm-email-change/confirm-email-change'
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password'
import { ResetPassword } from './pages/auth/reset-password/reset-password'
import { SignIn } from './pages/auth/sign-in/sign-in'
import { VerifyEmail } from './pages/auth/verify-email/verify-email'
import { NotFound } from './pages/e404'
import { ErrorPage } from './pages/error'
import { Register } from './pages/register/register'

export const router = createBrowserRouter([
	{
		path: '/',
		errorElement: <ErrorPage />,
		children: [
			{
				path: '/',
				element: <ProtectedRoute />,
				children: [
					{
						element: <AppLayout />,
						children: [
							// Each screen route is guarded by the same `can()`
							// the menu uses; the backend mirrors it later
							// (defense in depth).
							{
								element: <RequireScreen screen='gym.dashboard' />,
								children: [{ index: true, element: <Home /> }],
							},
							{
								element: <RequireScreen screen='gym.gyms' />,
								children: [{ path: 'gyms', element: <Gyms /> }],
							},
							{
								element: <RequireScreen screen='gym.check-in' />,
								children: [
									{ path: 'check-ins', element: <CheckIns /> },
								],
							},
							// Account is self-service — every authed user.
							{ path: 'account', element: <Account /> },
							{
								element: (
									<RequireScreen
										screen='gym.gyms'
										action='create'
									/>
								),
								children: [
									{ path: 'gyms/new', element: <NewGym /> },
								],
							},
							{
								element: (
									<RequireScreen screen='access-control.users' />
								),
								children: [
									{
										path: 'admin/users',
										element: <AdminUsers />,
									},
									{
										path: 'admin/users/:userId',
										element: <UserEdit />,
									},
								],
							},
						],
					},
				],
			},
			{
				path: '/sign-in',
				element: <AuthLayout />,
				children: [{ index: true, element: <SignIn /> }],
			},
			{
				path: '/register',
				element: <RegisterLayout />,
				children: [{ index: true, element: <Register /> }],
			},
			{
				path: '/forgot-password',
				element: <AuthLayout />,
				children: [{ index: true, element: <ForgotPassword /> }],
			},
			{
				path: '/users/reset-password',
				element: <AuthLayout />,
				children: [{ index: true, element: <ResetPassword /> }],
			},
			{
				path: '/users/verify-email',
				element: <AuthLayout />,
				children: [{ index: true, element: <VerifyEmail /> }],
			},
			{
				path: '/users/confirm-email-change',
				element: <AuthLayout />,
				children: [{ index: true, element: <ConfirmEmailChange /> }],
			},
		],
	},
	{
		path: '*',
		element: <NotFound />,
	},
])
