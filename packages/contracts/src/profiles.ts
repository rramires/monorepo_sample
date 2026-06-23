import { z } from 'zod'

// A profile is a named bundle of screen grants assigned to users. `is_system`
// protects seeded profiles (no delete, no key rename — grants stay editable);
// `is_default` is auto-attached on POST /register.
export const profileSchema = z.object({
	id: z.string(),
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	is_system: z.boolean(),
	is_default: z.boolean(),
})
export type Profile = z.infer<typeof profileSchema>

// One screen grant inside a profile: the four actions as booleans (map 1:1 to
// the TransferTable matrix columns). `can_view` defaults true — a granted
// screen is at least viewable.
export const profileScreenSchema = z.object({
	screen_id: z.string(),
	can_view: z.boolean().default(true),
	can_create: z.boolean().default(false),
	can_edit: z.boolean().default(false),
	can_delete: z.boolean().default(false),
	// At most one grant per profile is the profile's default landing screen.
	is_default: z.boolean().default(false),
})
export type ProfileScreen = z.infer<typeof profileScreenSchema>

// GET /profiles/:id — profile with its grants (feeds the TransferTable).
export const profileDetailSchema = profileSchema.extend({
	screens: z.array(profileScreenSchema),
})
export type ProfileDetail = z.infer<typeof profileDetailSchema>

// POST /profiles — create. `is_system` is never client-settable (seed-only).
export const createProfileBodySchema = z.object({
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	is_default: z.boolean().default(false),
})
export type CreateProfileBody = z.infer<typeof createProfileBodySchema>

// PATCH /profiles/:id — update; every field optional. (Blocking a key rename on
// a system profile is a backend-local refinement.)
export const updateProfileBodySchema = createProfileBodySchema.partial()
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>

// PUT /profiles/:id/screens — replace the profile's grants (TransferTable save).
export const setProfileScreensBodySchema = z.object({
	screens: z.array(profileScreenSchema),
})
export type SetProfileScreensBody = z.infer<typeof setProfileScreensBodySchema>

// PUT /users/:id/profiles — assign profiles to a user.
export const assignUserProfilesBodySchema = z.object({
	profile_ids: z.array(z.string()),
})
export type AssignUserProfilesBody = z.infer<
	typeof assignUserProfilesBodySchema
>
