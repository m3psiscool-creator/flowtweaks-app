import RANGES from '@data/performanceRanges.json'
import { getTweakById } from '@data/tweaks'
import type { Category } from '@data/schema'
import type { ScanReport } from '@shared/ipc-types'

/**
 * Turns a ScanReport + this PC's detected GPU into the honest, ranged projections Section 2
 * requires. The FPS estimate is a hardware lookup (data/performanceRanges.json's
 * fortnite_performance_mode_fps per tier — real Fortnite Performance Mode benchmark data, not a
 * synthetic on-device benchmark; see the research notes below) rather than a live measurement.
 * A live WebGL benchmark was tried first and dropped: its score had no real relationship to actual
 * game FPS (e.g. it read a GTX 1650 at ~185 fps and an RX 9060 XT at ~220 fps — both wrong, and
 * wrong in a way that undermines trust with an audience that already knows their hardware's real
 * numbers). A hardware-tier lookup grounded in real benchmarks beats a wrong "measurement."
 *
 * Sourcing note (moderate confidence, not settled fact): fortnite_performance_mode_fps ranges come
 * from a cluster of FPS-benchmark/settings sites (dropreference.com, betterfps.com,
 * theframecoach.com) cross-referenced against each other — no Digital Foundry/Gamers Nexus-grade
 * primary Fortnite benchmark exists. CPU matters meaningfully for Fortnite Performance Mode
 * specifically (roughly a 15-20% swing between a weak and strong CPU on the same GPU, more at the
 * high end) — captured here as range width, not a separate CPU multiplier, since there isn't solid
 * enough per-CPU-model data to justify one without guessing.
 */

export type ProjectionConfidence = 'measured' | 'conservative_estimate' | 'insufficient_data'

/** Categories from data/schema.ts that currently have at least one non-'none' fpsImpact tweak —
 *  the only ones performanceRanges.json carries an estimate for. See the Phase 4 design notes: a
 *  category with no real FPS-relevant tweaks (input, storage-cleanup, personalization,
 *  privacy-noise, startup-programs, game-specific) never gets a projected number, only a tweak count. */
export type FpsRangeCategory = 'background-processes' | 'windows-performance' | 'gpu' | 'fps-latency'

export type CategoryProjection =
  | {
      kind: 'fps'
      category: FpsRangeCategory | 'overall'
      confidence: ProjectionConfidence
      sampleSize: number
      avgFpsPctRange: [number, number]
      lowFpsPctRange: [number, number]
    }
  | {
      kind: 'latency'
      category: 'network'
      confidence: ProjectionConfidence
      sampleSize: number
      latencyMsRange: [number, number]
    }

export interface FreeScanProjection {
  /** null means the fallback pool was used — this specific hardware didn't have enough comparable data. */
  matchedTier: string | null
  overall: CategoryProjection
  /** Only categories with BOTH an available tweak count > 0 AND a real range entry — never a guessed one. */
  categories: CategoryProjection[]
  /** Real Fortnite Performance Mode FPS range for this hardware tier — undefined only when no tier matched (fallback has no absolute-FPS data, per Section 6). */
  estimatedFpsRange?: [number, number]
  /** estimatedFpsRange with the overall optimization gain applied to each bound. */
  projectedAvgFpsRange?: [number, number]
}

/** Section 2 rule #5 — the exact required disclaimer text, defined once so every screen that shows a projection quotes it verbatim instead of drifting. */
export const PROJECTION_DISCLAIMER =
  'Ranges reflect observed results on comparable hardware. Your results depend on your specific configuration and may fall outside this range.'

interface FpsRangeEntry {
  avg_fps_pct: [number, number]
  low_fps_pct: [number, number]
  sample_size: number
  confidence: ProjectionConfidence
}

interface NetworkRangeEntry {
  latency_ms_reduction: [number, number]
  sample_size: number
  confidence: ProjectionConfidence
}

interface TierDefinition {
  match: { gpu_class: string[] }
  fortnite_performance_mode_fps: [number, number]
  categories: Partial<Record<FpsRangeCategory, FpsRangeEntry>> & {
    overall: FpsRangeEntry
    network?: NetworkRangeEntry
  }
}

interface RangesFile {
  minSampleSize: number
  tierPriority: string[]
  tiers: Record<string, TierDefinition>
  fallback: FpsRangeEntry
}

const rangesData = RANGES as unknown as RangesFile

function toFpsProjection(category: FpsRangeCategory | 'overall', entry: FpsRangeEntry): CategoryProjection {
  return {
    kind: 'fps',
    category,
    confidence: entry.confidence,
    sampleSize: entry.sample_size,
    avgFpsPctRange: entry.avg_fps_pct,
    lowFpsPctRange: entry.low_fps_pct
  }
}

function toLatencyProjection(entry: NetworkRangeEntry): CategoryProjection {
  return {
    kind: 'latency',
    category: 'network',
    confidence: entry.confidence,
    sampleSize: entry.sample_size,
    latencyMsRange: entry.latency_ms_reduction
  }
}

/**
 * First tier in tierPriority whose gpu_class list has a substring match wins — order matters
 * because some tokens ("3060") are substrings of more specific ones ("3060 ti"), so higher/more
 * specific tiers must be checked first (see data/performanceRanges.json's tierPriority ordering).
 */
export function matchTier(gpuModel: string): { tierId: string; tier: TierDefinition } | null {
  const modelLower = gpuModel.toLowerCase()
  for (const tierId of rangesData.tierPriority) {
    const tier = rangesData.tiers[tierId]
    if (!tier) continue
    if (tier.match.gpu_class.some((token) => modelLower.includes(token))) {
      return { tierId, tier }
    }
  }
  return null
}

/**
 * Counts, per category, how many tweaks Scan found compatible-and-not-already-applied — the exact
 * "Available" bucket from CLAUDE-free-scan.md section 3, computed here (not re-derived by every
 * caller) so a results screen and this engine can never disagree on what counts as "available."
 */
export function countAvailableByCategory(scan: ScanReport): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {}
  for (const result of scan.results) {
    if (!result.compatible || result.currentState === 'already-enabled') continue
    const tweak = getTweakById(result.tweakId)
    if (!tweak) continue
    counts[tweak.category] = (counts[tweak.category] ?? 0) + 1
  }
  return counts
}

/** Applies a [lo,hi]% gain range to a [lo,hi] FPS range, bound-to-bound — the honest way to widen
 *  an already-a-range baseline by an already-a-range gain without collapsing either back to a
 *  single number. */
function applyPctRangeToRange(baseRange: [number, number], pctRange: [number, number]): [number, number] {
  const lo = Math.round(baseRange[0] * (1 + pctRange[0] / 100))
  const hi = Math.round(baseRange[1] * (1 + pctRange[1] / 100))
  return [lo, hi]
}

export function buildFreeScanProjection(
  gpuModel: string,
  availableByCategory: Partial<Record<Category, number>>
): FreeScanProjection {
  const matched = matchTier(gpuModel)
  // A matched tier with too few comparable systems is treated exactly like no match at all — same
  // "not enough data" path, never a half-confident number (Section 6).
  const usable = matched && matched.tier.categories.overall.sample_size >= rangesData.minSampleSize ? matched : null

  const overall = usable
    ? toFpsProjection('overall', usable.tier.categories.overall)
    : toFpsProjection('overall', rangesData.fallback)

  const categories: CategoryProjection[] = []
  if (usable) {
    const fpsCategories: FpsRangeCategory[] = ['background-processes', 'windows-performance', 'gpu', 'fps-latency']
    for (const category of fpsCategories) {
      const count = availableByCategory[category]
      if (!count) continue
      const entry = usable.tier.categories[category]
      if (!entry) continue
      categories.push(toFpsProjection(category, entry))
    }
    const networkCount = availableByCategory.network
    if (networkCount && usable.tier.categories.network) {
      categories.push(toLatencyProjection(usable.tier.categories.network))
    }
  }

  const estimatedFpsRange = usable ? usable.tier.fortnite_performance_mode_fps : undefined
  const projectedAvgFpsRange =
    estimatedFpsRange && overall.kind === 'fps' ? applyPctRangeToRange(estimatedFpsRange, overall.avgFpsPctRange) : undefined

  return {
    matchedTier: usable ? usable.tierId : null,
    overall,
    categories,
    estimatedFpsRange,
    projectedAvgFpsRange
  }
}
