import { IUsersRepository, PublicUser } from '@/repositories/i-users-repository'

import { UserAlreadyExistsError } from './errors/user-already-exists-error'

interface UpdateProfileUseCaseRequest {
	userId: string
	username?: string
	default_screen_key?: string | null
}

interface UpdateProfileUseCaseResponse {
	user: PublicUser
}

export class UpdateProfileUseCase {
	constructor(private usersRepository: IUsersRepository) {}

	async execute({
		userId,
		username,
		default_screen_key,
	}: UpdateProfileUseCaseRequest): Promise<UpdateProfileUseCaseResponse> {
		const data: { username?: string; default_screen_key?: string | null } =
			{}

		if (username !== undefined) {
			// Uniqueness: reject only if ANOTHER user owns the username. Renaming
			// to one's own current value is a harmless no-op. Comparison is
			// case-insensitive (in-memory lowercases; MySQL uses a CI collation).
			const owner = await this.usersRepository.findByUsername(username)
			if (owner && owner.id !== userId) {
				throw new UserAlreadyExistsError()
			}
			data.username = username
		}

		if (default_screen_key !== undefined) {
			data.default_screen_key = default_screen_key
		}

		const user = await this.usersRepository.update(userId, data)

		return {
			user,
		}
	}
}
