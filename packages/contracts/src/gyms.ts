import { z } from 'zod'

import { pageQuerySchema } from './primitives'

const latitude = z.number().min(-90).max(90)
const longitude = z.number().min(-180).max(180)

// POST /gyms — create (admin).
export const createGymBodySchema = z.object({
	title: z.string().min(1),
	description: z.string().nullish(),
	phone: z.string().nullish(),
	latitude,
	longitude,
})
export type CreateGymBody = z.infer<typeof createGymBodySchema>

// PATCH /gyms/:gymId — update (admin); every field optional. `is_active` toggles
// the soft-delete (deactivate / reactivate) — it's not settable on create.
export const updateGymBodySchema = createGymBodySchema.partial().extend({
	is_active: z.boolean().optional(),
})
export type UpdateGymBody = z.infer<typeof updateGymBodySchema>

// GET /gyms/search?query&page&includeInactive — `includeInactive` is honored
// only for gym managers (enforced server-side); members get active-only. Query
// coercion (string → boolean) stays local to the controller per doctrine.
export const searchGymsQuerySchema = z.object({
	query: z.string(),
	page: pageQuerySchema,
	includeInactive: z.boolean().optional(),
})
export type SearchGymsQuery = z.infer<typeof searchGymsQuerySchema>

// GET /gyms/nearby?latitude&longitude (query params → coerce from string).
export const nearbyGymsQuerySchema = z.object({
	latitude: z.coerce.number().min(-90).max(90),
	longitude: z.coerce.number().min(-180).max(180),
})
export type NearbyGymsQuery = z.infer<typeof nearbyGymsQuerySchema>
