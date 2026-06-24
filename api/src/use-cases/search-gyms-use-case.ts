import { Gym } from '@/prisma-client'
import { IGymsRepository } from '@/repositories/i-gyms-repository'

interface SearchGymsUseCaseRequest {
	query: string
	page: number
	// Managers only (gated at the controller); members default to active-only.
	includeInactive?: boolean
}

interface SearchGymsUseCaseResponse {
	gyms: Gym[]
}

export class SearchGymsUseCase {
	constructor(private gymsRepository: IGymsRepository) {}

	async execute({
		query,
		page,
		includeInactive = false,
	}: SearchGymsUseCaseRequest): Promise<SearchGymsUseCaseResponse> {
		// search
		const gyms = await this.gymsRepository.searchMany(
			query,
			page,
			includeInactive,
		)
		return {
			gyms,
		}
	}
}
