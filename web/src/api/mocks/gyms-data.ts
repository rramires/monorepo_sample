import type { Gym } from '../search-gyms'

// Mock-only in-memory store. Seeded gyms cluster around São Paulo so the
// "nearby" mock has something to return; newly created gyms are pushed here.
// 24 gyms (22 active + 2 deactivated) so the paginated list (PAGE_SIZE 20)
// shows a second page, and "Show deactivated" has something to reveal.
type Seed = Omit<Gym, 'id' | 'latitude' | 'longitude'> & {
	latitude?: number
	longitude?: number
}

const SEED: Seed[] = [
	{ title: 'Iron Temple', description: 'Heavy lifting in the city center.', phone: '+5511970000001', is_active: true }, // prettier-ignore
	{ title: 'Aqua Fitness', description: 'Pool, sauna and cardio.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Zen Yoga Studio', description: null, phone: '+5511970000003', is_active: true }, // prettier-ignore
	{ title: 'Powerhouse Gym', description: 'Open 24 hours.', phone: '+5511970000004', is_active: false }, // prettier-ignore
	{ title: 'Summit CrossFit', description: 'Box with daily WODs.', phone: '+5511970000005', is_active: true }, // prettier-ignore
	{ title: 'Pulse Studio', description: 'Spinning and HIIT.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Titan Strength', description: 'Powerlifting platform.', phone: '+5511970000007', is_active: true }, // prettier-ignore
	{ title: 'Flow Pilates', description: 'Reformer classes.', phone: '+5511970000008', is_active: true }, // prettier-ignore
	{ title: 'Velocity Running Club', description: 'Track and trail.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Granite Climbing', description: 'Bouldering and top-rope.', phone: '+5511970000010', is_active: true }, // prettier-ignore
	{ title: 'Harbor Boxing', description: 'Bag work and sparring.', phone: '+5511970000011', is_active: true }, // prettier-ignore
	{ title: 'Evergreen Wellness', description: 'Yoga and meditation.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Forge Athletics', description: 'Functional training.', phone: '+5511970000013', is_active: true }, // prettier-ignore
	{ title: 'Cobalt Cycle', description: 'Indoor cycling theatre.', phone: '+5511970000014', is_active: true }, // prettier-ignore
	{ title: 'Apex Martial Arts', description: 'BJJ and muay thai.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Lighthouse Swim', description: 'Lap pool and lessons.', phone: '+5511970000016', is_active: true }, // prettier-ignore
	{ title: 'Redwood Strength', description: 'Old-school iron.', phone: '+5511970000017', is_active: true }, // prettier-ignore
	{ title: 'Momentum Fitness', description: 'Cardio and weights.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Solstice Yoga', description: 'Hot yoga studio.', phone: '+5511970000019', is_active: true }, // prettier-ignore
	{ title: 'Sunset Fitness', description: 'Closed for renovation.', phone: '+5511970000020', is_active: false }, // prettier-ignore
	{ title: 'Vanguard CrossFit', description: 'Competitive programming.', phone: '+5511970000021', is_active: true }, // prettier-ignore
	{ title: 'Riverside Rowing', description: 'Ergs and on-water.', phone: null, is_active: true }, // prettier-ignore
	{ title: 'Olympus Barbell', description: 'Olympic weightlifting.', phone: '+5511970000023', is_active: true }, // prettier-ignore
	{ title: 'Meridian Health Club', description: 'Full-service club.', phone: '+5511970000024', is_active: true }, // prettier-ignore
]

export const gyms: Gym[] = SEED.map((seed, index) => ({
	id: `gym-${index + 1}`,
	title: seed.title,
	description: seed.description,
	phone: seed.phone,
	// Spread around São Paulo so distinct coordinates render on the cards.
	latitude: -23.55 + (index % 6) * 0.01,
	longitude: -46.63 + Math.floor(index / 6) * 0.01,
	is_active: seed.is_active,
}))
