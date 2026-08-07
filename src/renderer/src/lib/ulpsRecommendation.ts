export interface UlpsRecommendation {
  level: 'recommended' | 'not-recommended'
  reason: string
}

/**
 * ULPS (Ultra Low Power State) governs how aggressively AMD's driver powers down a GPU it thinks
 * is idle — historically a CrossFire/multi-GPU concern (parking the secondary card), with thinner,
 * more contested evidence for single-GPU stutter. Gate the recommendation on actual detected GPU
 * count rather than asserting one answer for every AMD system.
 */
export function getUlpsRecommendation(gpuCount: number): UlpsRecommendation {
  if (gpuCount >= 2) {
    return {
      level: 'recommended',
      reason:
        'Multiple GPUs detected — this is exactly the scenario ULPS was built for. Disabling it avoids the secondary card being aggressively parked, a documented source of stutter on multi-GPU setups.'
    }
  }
  return {
    level: 'not-recommended',
    reason:
      'Only one GPU detected. ULPS mainly matters for multi-GPU/CrossFire setups — on a single-GPU system the effect is thin to nonexistent in most reporting. Safe to apply, just don\'t expect much from it here.'
  }
}
