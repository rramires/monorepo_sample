import { setProfileGrantsBodySchema } from '@root/contracts'
import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import { makeProfilesUseCase } from '@/use-cases/factories/make-profiles-use-case'

export async function setScreensController(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const paramsSchema = z.object({
		id: z.uuid(),
	})
	const { id } = paramsSchema.parse(request.params)

	const { screens, default_screen_id } = setProfileGrantsBodySchema.parse(
		request.body,
	)

	const profilesUseCase = makeProfilesUseCase()
	const detail = await profilesUseCase.setGrants(
		id,
		screens.map((s) => ({
			screen_id: s.screen_id,
			permission_ids: s.permission_ids,
		})),
		default_screen_id,
	)

	// The updated ProfileDetail object is sent directly (not wrapped).
	return reply.send(detail)
}
