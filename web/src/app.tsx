import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'

import { Toaster } from '@/components/ui/sonner'

import { AuthProvider } from './components/auth/auth-provider'
import { LocaleProvider } from './components/locale/locale-provider'
import { ThemeProvider } from './components/theme/theme-provider'
import { TitleProvider } from './components/title/title-provider'
import { queryClient } from './lib/react-query'
import { router } from './routes'

export function App() {
	return (
		<LocaleProvider>
			<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
				<TitleProvider
					titleTemplate='%s | FrontEnd'
					defaultTitle='FrontEnd'
				>
					<QueryClientProvider client={queryClient}>
						<AuthProvider>
							<RouterProvider router={router} />
							<Toaster richColors />
						</AuthProvider>
					</QueryClientProvider>
				</TitleProvider>
			</ThemeProvider>
		</LocaleProvider>
	)
}
