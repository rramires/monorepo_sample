import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeSearchGymsUseCase } from '@/use-cases/factories/make-search-gyms-use-case'

import { resolveIncludeInactive } from './can-include-inactive'

export async function searchController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const bodySchema = z.object({
		// Empty query lists all gyms (paginated) — the manager "browse all" view;
		// members send a name to filter.
		query: z.string().default(''),
		page: z.coerce.number().min(1).default(1),
		// Opt-in to inactive gyms. Honored only for gym managers (gated below);
		// members always get active-only.
		includeInactive: z
			.enum(['true', 'false'])
			.optional()
			.transform((value) => value === 'true'),
	})
	const { query, page, includeInactive } = bodySchema.parse(request.query)

	const allowInactive = await resolveIncludeInactive(request, includeInactive)

	const searchGymsUseCase = makeSearchGymsUseCase()
	const { gyms } = await searchGymsUseCase.execute({
		query,
		page,
		includeInactive: allowInactive,
	})

	return reply.status(200).send({
		gyms,
	})
}
