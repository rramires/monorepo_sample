import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeFetchNearbyGymsUseCase } from '@/use-cases/factories/make-fetch-nearby-gyms-use-case'

import { resolveIncludeInactive } from './can-include-inactive'

export async function nearbyController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const bodySchema = z.object({
		latitude: z.coerce.number().refine((value) => {
			return Math.abs(value) <= 90
		}),
		longitude: z.coerce.number().refine((value) => {
			return Math.abs(value) <= 180
		}),
		// Managers may include inactive gyms (gated below); members get active-only.
		includeInactive: z
			.enum(['true', 'false'])
			.optional()
			.transform((value) => value === 'true'),
	})
	const { latitude, longitude, includeInactive } = bodySchema.parse(
		request.query,
	)

	const allowInactive = await resolveIncludeInactive(request, includeInactive)

	const fetchNearbyGymsUseCase = makeFetchNearbyGymsUseCase()
	const { gyms } = await fetchNearbyGymsUseCase.execute({
		userLatitude: latitude,
		userLongitude: longitude,
		includeInactive: allowInactive,
	})

	return reply.status(200).send({
		gyms,
	})
}
