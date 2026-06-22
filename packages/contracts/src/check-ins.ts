import { z } from 'zod'

// POST /gyms/:gymId/check-ins — the user's current coordinates.
export const checkInBodySchema = z.object({
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
})
export type CheckInBody = z.infer<typeof checkInBodySchema>
