import { PageTitle } from '@/components/title/page-title'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useRegisterPM } from './use-register-pm'

export function Register() {
	const pm = useRegisterPM()

	return (
		<>
			<PageTitle title='Register' />

			<div className='flex flex-1 items-center justify-center p-4 sm:p-8'>
				<Card className='w-full max-w-sm'>
					<CardHeader>
						<CardTitle>Create account</CardTitle>
						<CardDescription>
							Fill in the fields to create your account.
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={pm.handleSubmit}>
							<div className='flex flex-col gap-6'>
								<div className='grid gap-2'>
									<Label htmlFor='username'>Username</Label>
									<Input
										id='username'
										type='text'
										autoFocus
										placeholder='your_username'
										{...pm.register('username')}
									/>
									{pm.errors.username && (
										<p className='text-destructive text-sm'>
											{pm.errors.username.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='email'>Email</Label>
									<Input
										id='email'
										type='email'
										placeholder='m@example.com'
										{...pm.register('email')}
									/>
									{pm.errors.email && (
										<p className='text-destructive text-sm'>
											{pm.errors.email.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='password'>Password</Label>
									<Input
										id='password'
										type='password'
										{...pm.register('password')}
									/>
									{pm.errors.password && (
										<p className='text-destructive text-sm'>
											{pm.errors.password.message}
										</p>
									)}
								</div>

								<div className='grid gap-2'>
									<Label htmlFor='confirmPassword'>
										Confirm password
									</Label>
									<Input
										id='confirmPassword'
										type='password'
										{...pm.register('confirmPassword')}
									/>
									{pm.errors.confirmPassword && (
										<p className='text-destructive text-sm'>
											{pm.errors.confirmPassword.message}
										</p>
									)}
								</div>

								<Button
									type='submit'
									disabled={pm.isSubmitting}
									className='w-full'
								>
									Sign up
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	)
}
