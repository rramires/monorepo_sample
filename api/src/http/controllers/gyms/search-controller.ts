import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { env } from '@/env'
import { makeGetUserPermissionsUseCase } from '@/use-cases/factories/make-get-user-permissions-use-case'
import { makeSearchGymsUseCase } from '@/use-cases/factories/make-search-gyms-use-case'

export async function searchController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const bodySchema = z.object({
		query: z.string().min(env.MIN_TEXT_LENGTH),
		page: z.coerce.number().min(1).default(1),
		// Opt-in to inactive gyms. Honored only for gym managers (gated below);
		// members always get active-only.
		includeInactive: z
			.enum(['true', 'false'])
			.optional()
			.transform((value) => value === 'true'),
	})
	const { query, page, includeInactive } = bodySchema.parse(request.query)

	// `includeInactive` is a management view — allow it only when the caller can
	// edit gyms (ADMIN bypasses). A member passing the flag still gets active-only.
	let allowInactive = false
	if (includeInactive) {
		const getUserPermissions = makeGetUserPermissionsUseCase()
		const { role, screens } = await getUserPermissions.execute({
			userId: request.user.sub,
		})
		allowInactive =
			role === 'ADMIN' ||
			Boolean(screens.find((s) => s.screen_key === 'gym.gyms')?.edit)
	}

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
