import type { Category } from './schema'

export interface GameProfile {
  id: string
  name: string
  /** Categories weighted higher for this profile's FPS Estimator score — a defensible heuristic, not real benchmark data. */
  emphasize: Category[]
}

export const GAME_PROFILES: GameProfile[] = [
  { id: 'fortnite-competitive', name: 'Fortnite Competitive', emphasize: ['fps-latency', 'gpu', 'network'] },
  { id: 'valorant-competitive', name: 'Valorant Competitive', emphasize: ['fps-latency', 'gpu', 'network'] },
  { id: 'cs2-competitive', name: 'Counter-Strike 2', emphasize: ['fps-latency', 'gpu', 'network'] },
  { id: 'cod-competitive', name: 'Call of Duty', emphasize: ['fps-latency', 'gpu', 'network'] },
  { id: 'general-gaming', name: 'General Gaming', emphasize: ['fps-latency', 'gpu'] },
  { id: 'streaming-gaming', name: 'Streaming & Gaming', emphasize: ['windows-performance', 'background-processes'] },
  { id: 'low-end-pc', name: 'Low-End Computer', emphasize: ['windows-performance', 'background-processes', 'gpu'] }
]
