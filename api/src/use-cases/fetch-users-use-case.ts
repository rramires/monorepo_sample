import { IUsersRepository, PublicUser } from '@/repositories/i-users-repository'

interface FetchUsersUseCaseRequest {
	page: number
}

interface FetchUsersUseCaseResponse {
	users: PublicUser[]
	total: number
}

export class FetchUsersUseCase {
	constructor(private usersRepository: IUsersRepository) {}

	async execute({
		page,
	}: FetchUsersUseCaseRequest): Promise<FetchUsersUseCaseResponse> {
		const [users, total] = await Promise.all([
			this.usersRepository.findMany(page),
			this.usersRepository.countMany(),
		])

		return {
			users,
			total,
		}
	}
}
