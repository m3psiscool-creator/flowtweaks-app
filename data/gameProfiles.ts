import type { Category } from './schema'

export interface GameProfile {
  id: string
  name: string
  description: string
  /** Categories weighted higher for this profile's FPS Estimator score — a defensible heuristic, not real benchmark data. */
  emphasize: Category[]
  /** The tweaks this profile bundles into one apply — always a subset of APPLY_ENABLED_TWEAK_IDS. */
  tweakIds: string[]
}

const COMPETITIVE_BUNDLE = ['game-mode', 'fullscreen-optimizations', 'scheduling-registry-tweaks', 'hags', 'dns-cloudflare']

export const GAME_PROFILES: GameProfile[] = [
  {
    id: 'fortnite-competitive',
    name: 'Fortnite Competitive',
    description: 'Latency and scheduling tweaks tuned for ranked/tournament play.',
    emphasize: ['fps-latency', 'gpu', 'network'],
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'valorant-competitive',
    name: 'Valorant Competitive',
    description: 'Latency and scheduling tweaks tuned for ranked/tournament play.',
    emphasize: ['fps-latency', 'gpu', 'network'],
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'cs2-competitive',
    name: 'Counter-Strike 2',
    description: 'Latency and scheduling tweaks tuned for ranked/tournament play.',
    emphasize: ['fps-latency', 'gpu', 'network'],
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'cod-competitive',
    name: 'Call of Duty',
    description: 'Latency and scheduling tweaks tuned for ranked/tournament play.',
    emphasize: ['fps-latency', 'gpu', 'network'],
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'general-gaming',
    name: 'General Gaming',
    description: 'A safe, broadly useful set for anything you play casually.',
    emphasize: ['fps-latency', 'gpu'],
    tweakIds: ['game-mode', 'fullscreen-optimizations', 'scheduling-registry-tweaks', 'hags']
  },
  {
    id: 'streaming-gaming',
    name: 'Streaming & Gaming',
    description: 'Leaves more headroom for OBS/encoder load alongside the game.',
    emphasize: ['windows-performance', 'background-processes'],
    tweakIds: ['disable-fast-startup', 'visual-effects', 'game-mode']
  },
  {
    id: 'low-end-pc',
    name: 'Low-End Computer',
    description: 'Trims overhead for older or budget hardware.',
    emphasize: ['windows-performance', 'background-processes', 'gpu'],
    tweakIds: ['disable-fast-startup', 'visual-effects', 'hags']
  }
]
