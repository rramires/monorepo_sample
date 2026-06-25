import { z } from 'zod'

// A profile is a named bundle of screen memberships + permission grants assigned
// to users. `is_system` protects seeded profiles (no delete, no key rename —
// grants stay editable); `is_default` is auto-attached on POST /register.
export const profileSchema = z.object({
	id: z.string(),
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	is_system: z.boolean(),
	// The registration default profile (exactly one across all profiles). Distinct
	// from `default_screen_id` (the landing screen) below.
	is_default: z.boolean(),
	// Lifecycle (disable). Inactive profiles are hidden from the "add" pickers when
	// assigning profiles to users; existing assignments keep working. Toggled via
	// the edit dialog's Active switch.
	is_active: z.boolean(),
})
export type Profile = z.infer<typeof profileSchema>

// One assigned screen inside a profile: membership (the screen is in the profile,
// hence in the user's sidebar) + the granted permission ids for that screen (a
// subset of the screen's curated catalog). An empty `permission_ids` means the
// screen is a member with no permissions yet — staged rollout.
export const profileScreenGrantSchema = z.object({
	screen_id: z.string(),
	permission_ids: z.array(z.string()),
})
export type ProfileScreenGrant = z.infer<typeof profileScreenGrantSchema>

// GET /profiles/:id — profile with its memberships+grants (feeds the
// TransferTable + permission badges) and its landing screen.
export const profileDetailSchema = profileSchema.extend({
	// The profile's landing screen (must be an assigned, viewable screen). Replaces
	// the old per-grant `is_default` flag + its "max one per profile" invariant.
	default_screen_id: z.string().nullable(),
	screens: z.array(profileScreenGrantSchema),
})
export type ProfileDetail = z.infer<typeof profileDetailSchema>

// POST /profiles — create. `is_system`/`is_active` are never client-settable on
// create (seed-only / default true).
export const createProfileBodySchema = z.object({
	key: z.string().min(1),
	name: z.string().min(1),
	description: z.string().nullish(),
	is_default: z.boolean().default(false),
})
export type CreateProfileBody = z.infer<typeof createProfileBodySchema>

// PATCH /profiles/:id — update; every field optional. Adds the Active switch on
// top of the editable create fields. (Blocking a key rename on a system profile
// is a backend-local refinement.)
export const updateProfileBodySchema = createProfileBodySchema.partial().extend({
	is_active: z.boolean().optional(),
})
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>

// PUT /profiles/:id/screens — replace the profile's memberships, per-screen
// granted permissions and landing screen in one call (the profile-detail save).
export const setProfileGrantsBodySchema = z.object({
	screens: z.array(profileScreenGrantSchema),
	default_screen_id: z.string().nullable().default(null),
})
export type SetProfileGrantsBody = z.infer<typeof setProfileGrantsBodySchema>

// PUT /users/:id/profiles — assign profiles to a user.
export const assignUserProfilesBodySchema = z.object({
	profile_ids: z.array(z.string()),
})
export type AssignUserProfilesBody = z.infer<
	typeof assignUserProfilesBodySchema
>
