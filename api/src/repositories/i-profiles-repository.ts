import { Profile } from '@/prisma-client'

// One screen grant inside a profile: the four actions as booleans. Mirrors the
// `profile_screens` row shape (sans `profile_id`, which the repo owns).
export interface GrantRow {
	screen_id: string
	can_view: boolean
	can_create: boolean
	can_edit: boolean
	can_delete: boolean
	is_default: boolean
}

// Partial edit: `undefined` = leave as-is; `null` clears the nullable
// description.
export interface IProfileUpdateInput {
	key?: string
	name?: string
	description?: string | null
	is_default?: boolean
}

export interface IProfilesRepository {
	list(): Promise<Profile[]>
	findById(id: string): Promise<Profile | null>
	findDetail(id: string): Promise<(Profile & { screens: GrantRow[] }) | null>
	create(data: {
		key: string
		name: string
		description?: string | null
		is_default: boolean
	}): Promise<Profile>
	update(id: string, data: IProfileUpdateInput): Promise<Profile>
	delete(id: string): Promise<void>
	setScreens(id: string, grants: GrantRow[]): Promise<void>
}
