import { Gym, Prisma } from '@/prisma-client'

export interface IFindManyNearbyParams {
	latitude: number
	longitude: number
}

// Partial edit: only the admin-editable fields. `undefined` = leave as-is;
// `null` clears the nullable description/phone. `is_active` toggles soft-delete.
export interface IGymUpdateInput {
	title?: string
	description?: string | null
	phone?: string | null
	is_active?: boolean
}

export interface IGymsRepository {
	create(data: Prisma.GymCreateInput): Promise<Gym>
	findById(id: string): Promise<Gym | null>
	update(id: string, data: IGymUpdateInput): Promise<Gym>
	// `includeInactive` is honored only for gym managers (gated at the controller);
	// members always get active-only. `findManyNearby` is always active-only.
	searchMany(
		query: string,
		page: number,
		includeInactive?: boolean,
	): Promise<Gym[]>
	findManyNearby(params: IFindManyNearbyParams): Promise<Gym[]>
}
