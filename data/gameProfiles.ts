import type { Category } from './schema'

export interface GameProfile {
  id: string
  name: string
  description: string
  /**
   * Per-category multiplier for the FPS Estimator, grounded in that game's actual documented
   * CPU/GPU/network bottleneck profile — not a guess, and not the same for every game. 1.0 is
   * baseline; higher means tweaks in that category matter more for THIS game specifically.
   * Missing category = 1.0 (baseline, no special emphasis).
   *
   * Sourcing (cross-referenced across multiple independent benchmark/analysis sites, August 2026):
   * - Valorant: extremely CPU-bound by design — budget and flagship GPUs land within a few percent
   *   of each other because the CPU caps FPS first; GPU tweaks are close to irrelevant here.
   * - CS2: also CPU-bound (Source 2's sub-tick simulation leans on single-core speed), but GPU
   *   matters more than Valorant because of Source 2's lighting/smoke rendering cost.
   * - Fortnite: CPU-heavy specifically at the low "Performance Mode" settings competitive players
   *   actually run; GPU only dominates at high visual settings nobody competitive uses. Network
   *   matters more here than the other three (100-player battle royale sync).
   *   the RAM-usage-climbs-over-a-session issue documented for the engine.
   * - Call of Duty/Warzone: CPU-bound at 1080p, shifts toward GPU at higher resolutions; also has a
   *   documented RAM-climbs-over-a-session issue and shader-compilation stutter tied to storage
   *   speed — a genuinely different profile from the other three, not just "CPU-bound shooter #4."
   *
   * This is still a heuristic weighting on top of real characteristics, not a measured benchmark —
   * worded that way everywhere it's shown to the customer.
   */
  categoryWeights: Partial<Record<Category, number>>
  /** The tweaks this profile bundles into one apply — always a subset of APPLY_ENABLED_TWEAK_IDS. */
  tweakIds: string[]
}

const COMPETITIVE_BUNDLE = [
  'game-mode',
  'fullscreen-optimizations',
  'scheduling-registry-tweaks',
  'hags',
  'dns-cloudflare',
  'disable-mouse-acceleration',
  'disable-accessibility-shortcuts',
  'disable-hibernation'
]

export const GAME_PROFILES: GameProfile[] = [
  {
    id: 'fortnite-competitive',
    name: 'Fortnite Competitive',
    description: 'CPU- and network-leaning — built around Performance Mode\'s actual bottleneck.',
    categoryWeights: { 'fps-latency': 1.7, input: 1.2, gpu: 0.6, network: 1.5, 'windows-performance': 1.2, 'background-processes': 1.2 },
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'valorant-competitive',
    name: 'Valorant Competitive',
    description: 'Almost entirely CPU-bound — GPU tweaks barely move the needle here.',
    categoryWeights: { 'fps-latency': 2.0, input: 1.5, gpu: 0.3, network: 1.2, 'windows-performance': 1.3, 'background-processes': 1.3 },
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'cs2-competitive',
    name: 'Counter-Strike 2',
    description: 'CPU-bound like Valorant, but Source 2\'s lighting gives GPU tweaks real weight too.',
    categoryWeights: { 'fps-latency': 1.8, input: 1.3, gpu: 0.8, network: 1.2, 'windows-performance': 1.1, 'background-processes': 1.1 },
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'cod-competitive',
    name: 'Call of Duty',
    description: 'CPU-bound at 1080p but GPU-hungry at higher res — plus real RAM/storage pressure.',
    categoryWeights: {
      'fps-latency': 1.6,
      input: 1.1,
      gpu: 1.0,
      network: 1.3,
      'windows-performance': 1.4,
      'background-processes': 1.4,
      'storage-cleanup': 1.2
    },
    tweakIds: COMPETITIVE_BUNDLE
  },
  {
    id: 'general-gaming',
    name: 'General Gaming',
    description: 'A safe, broadly useful set for anything you play casually.',
    categoryWeights: { 'fps-latency': 1.2, gpu: 1.0 },
    tweakIds: ['game-mode', 'fullscreen-optimizations', 'scheduling-registry-tweaks', 'hags', 'disable-mouse-acceleration']
  },
  {
    id: 'streaming-gaming',
    name: 'Streaming & Gaming',
    description: 'Leaves more headroom for OBS/encoder load alongside the game.',
    categoryWeights: { 'windows-performance': 1.4, 'background-processes': 1.5, 'fps-latency': 0.8 },
    tweakIds: [
      'disable-fast-startup',
      'visual-effects',
      'game-mode',
      'disable-hibernation',
      'delivery-optimization-http-only',
      'disable-suggestions-spotlight'
    ]
  },
  {
    id: 'low-end-pc',
    name: 'Low-End Computer',
    description: 'Trims overhead for older or budget hardware.',
    categoryWeights: { 'windows-performance': 1.6, 'background-processes': 1.6, gpu: 1.3, 'storage-cleanup': 1.2 },
    tweakIds: ['disable-fast-startup', 'visual-effects', 'hags', 'enable-ssd-trim', 'disable-hibernation']
  }
]
