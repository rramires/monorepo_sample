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
	// Total matches across all pages — for the "X–Y of Z" pager.
	total: number
}

export class SearchGymsUseCase {
	constructor(private gymsRepository: IGymsRepository) {}

	async execute({
		query,
		page,
		includeInactive = false,
	}: SearchGymsUseCaseRequest): Promise<SearchGymsUseCaseResponse> {
		const [gyms, total] = await Promise.all([
			this.gymsRepository.searchMany(query, page, includeInactive),
			this.gymsRepository.countMany(query, includeInactive),
		])
		return {
			gyms,
			total,
		}
	}
}
