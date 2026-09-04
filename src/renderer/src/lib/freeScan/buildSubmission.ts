import type { Category } from '@data/schema'
import type { FreeScanReport, FreeScanSubmission } from '@shared/ipc-types'
import type { FreeScanProjection } from './projectionEngine'

/**
 * Turns what's already on screen into the exact wire payload the backend stores — deliberately
 * reads from the same `projection`/`availableByCategory` the results screen renders, so the email
 * a customer gets can never disagree with what they just saw (see server.py's
 * _free_scan_category_line, which rebuilds display lines from these same fields for the same reason).
 *
 * The backend's baseline_* fields predate the move from a live on-device benchmark to a hardware
 * lookup (see projectionEngine.ts) — repurposed rather than re-plumbed through another backend
 * deploy: baseline_avg_fps holds the estimated range's midpoint (a real number we actually showed,
 * not a fabricated one), baseline_sample_count holds the tier's comparable-systems count, and
 * baseline_one_percent_low_fps stays unset since there's no modeled 1%-low to report honestly.
 */
export function buildFreeScanSubmission(
  report: FreeScanReport,
  projection: FreeScanProjection | null,
  availableByCategory: Partial<Record<Category, number>>,
  alreadyOptimalCount: number,
  email?: string
): FreeScanSubmission {
  const totalAvailable = Object.values(availableByCategory).reduce<number>((sum, n) => sum + (n ?? 0), 0)
  const estimatedMidpoint = projection?.estimatedFpsRange
    ? Math.round((projection.estimatedFpsRange[0] + projection.estimatedFpsRange[1]) / 2)
    : undefined

  return {
    email: email?.trim() || undefined,
    cpu_model: report.specs.cpuModel,
    gpu_model: report.specs.gpuModel,
    gpu_vendors: report.specs.gpuVendors,
    ram_total_bytes: report.specs.ramTotalBytes,
    windows_version: report.specs.windowsVersion,
    storage_type: report.extras.hardware.storageType,
    baseline_avg_fps: estimatedMidpoint,
    baseline_sample_count: projection?.matchedTier ? projection.overall.sampleSize : undefined,
    total_available: totalAvailable,
    already_optimal_count: alreadyOptimalCount,
    matched_tier: projection?.matchedTier ?? undefined,
    projected_avg_fps_range: projection?.projectedAvgFpsRange,
    categories: (Object.entries(availableByCategory) as [Category, number | undefined][])
      .filter(([, count]) => (count ?? 0) > 0)
      .map(([category, count]) => {
        const rangeProjection = projection?.categories.find((p) => p.category === category)
        return {
          category,
          available_count: count ?? 0,
          avg_fps_pct_range: rangeProjection?.kind === 'fps' ? rangeProjection.avgFpsPctRange : undefined,
          low_fps_pct_range: rangeProjection?.kind === 'fps' ? rangeProjection.lowFpsPctRange : undefined,
          latency_ms_range: rangeProjection?.kind === 'latency' ? rangeProjection.latencyMsRange : undefined
        }
      })
  }
}
