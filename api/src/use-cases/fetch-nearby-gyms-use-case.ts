import { Gym } from '@/prisma-client'
import { IGymsRepository } from '@/repositories/i-gyms-repository'

interface FetchNearbyGymsUseCaseRequest {
	userLatitude: number
	userLongitude: number
	// Managers only (gated at the controller); members default to active-only.
	includeInactive?: boolean
}

interface FetchNearbyGymsCaseResponse {
	gyms: Gym[]
}

export class FetchNearbyGymsUseCase {
	constructor(private gymsRepository: IGymsRepository) {}

	async execute({
		userLatitude,
		userLongitude,
		includeInactive = false,
	}: FetchNearbyGymsUseCaseRequest): Promise<FetchNearbyGymsCaseResponse> {
		// find
		const gyms = await this.gymsRepository.findManyNearby(
			{
				latitude: userLatitude,
				longitude: userLongitude,
			},
			includeInactive,
		)
		return {
			gyms,
		}
	}
}
