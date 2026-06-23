import { hash } from 'bcryptjs'

import type { IUserProfilesRepository } from '@/repositories/i-user-profiles-repository'
import { IUsersRepository, PublicUser } from '@/repositories/i-users-repository'

import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface RegisterUseCaseRequest {
	username: string
	email: string
	password: string
}

interface RegisterUseCaseResponse {
	user: PublicUser
}

export class RegisterUseCase {
	constructor(
		private usersRepository: IUsersRepository,
		// Optional: when provided, the is_default profile is attached on register.
		private userProfilesRepository?: IUserProfilesRepository,
	) {}
	/* 
		Hack: Using "private" or "public" in the constructor parameters does 
		the same as declaring the property before the constructor and then assigning this:
		
		private usersRepository: any
		constructor(usersRepository: any) {
			this.usersRepository = usersRepository
		}
	*/

	async execute({
		username,
		email,
		password,
	}: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {
		// check email and username — both are unique
		const userWithSameEmail = await this.usersRepository.findByEmail(email)
		const userWithSameUsername =
			await this.usersRepository.findByUsername(username)
		if (userWithSameEmail || userWithSameUsername) {
			// Hash anyway so the response timing matches a real registration and
			// does not reveal that the email/username already exists. Discarded.
			await hash(password, 12)
			throw new UserAlreadyExistsError()
		}
		// hash
		const password_hash = await hash(password, 12)
		// call persistence
		const user = await this.usersRepository.create({
			username,
			email,
			password_hash,
		})

		// New users inherit the is_default profile (their baseline screens).
		await this.userProfilesRepository?.attachDefault(user.id)

		return {
			user,
		}
	}
}
