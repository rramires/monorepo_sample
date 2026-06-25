import { Profile } from '@/prisma-client'

// One assigned screen inside a profile: membership + the granted permission ids
// (a subset of the screen's catalog). Empty `permission_ids` = member, no grants.
export interface ProfileScreenGrant {
	screen_id: string
	permission_ids: string[]
}

// Partial edit: `undefined` = leave as-is; `null` clears the nullable
// description.
export interface IProfileUpdateInput {
	key?: string
	name?: string
	description?: string | null
	is_default?: boolean
	is_active?: boolean
}

export interface IProfilesRepository {
	list(): Promise<Profile[]>
	findById(id: string): Promise<Profile | null>
	findDetail(
		id: string,
	): Promise<(Profile & { screens: ProfileScreenGrant[] }) | null>
	create(data: {
		key: string
		name: string
		description?: string | null
		is_default: boolean
	}): Promise<Profile>
	update(id: string, data: IProfileUpdateInput): Promise<Profile>
	delete(id: string): Promise<void>
	/** Replace the profile's membership, granted permissions and landing screen. */
	setGrants(
		id: string,
		grants: ProfileScreenGrant[],
		defaultScreenId: string | null,
	): Promise<void>
	/** Clear `is_default` on every profile except `keepId` (single-default radio). */
	clearDefaultExcept(keepId: string): Promise<void>
	/** How many users hold this profile — the no-cascade delete guard. */
	countUsers(id: string): Promise<number>
}
