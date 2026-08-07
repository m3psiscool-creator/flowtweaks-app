import type { GpuVendor } from '@shared/ipc-types'

export interface HagsRecommendation {
  level: 'recommended' | 'not-recommended'
  reason: string
}

type Tier = 'modern' | 'older-supported' | 'unsupported'

// HAGS (HwSchMode=2) needs a WDDM 2.7+ driver — GTX 10-series (Pascal, 2016) for NVIDIA, RX
// 5000-series (RDNA1, 2019) for AMD, all Intel Arc cards. Below that floor Windows won't expose a
// working scheduling path at all. Above the floor, independent benchmarking (Microsoft's own
// DirectX blog + community testing) puts the typical gain at ~0.3-5% FPS, mostly felt as smoother
// frame pacing / lower 1% lows in CPU-bound scenarios rather than a raw FPS jump — and it can cost
// up to ~1GB of extra VRAM, which is why older-but-technically-supported cards get a more cautious
// "not recommended" rather than a blanket "recommended" that current-gen cards get.
function nvidiaTier(model: string): Tier | null {
  if (/RTX\s*\d{3,4}/i.test(model)) return 'modern'
  const gtx = model.match(/GTX\s*(\d{3,4})/i)
  if (gtx) return Number(gtx[1]) >= 1000 ? 'older-supported' : 'unsupported'
  return null
}

function amdTier(model: string): Tier | null {
  const rx = model.match(/RX\s*(\d{3,4})/i)
  if (rx) {
    const num = Number(rx[1])
    if (num >= 6000) return 'modern'
    if (num >= 5000) return 'older-supported'
    return 'unsupported'
  }
  return null
}

function intelTier(model: string): Tier | null {
  if (/\bArc\b/i.test(model)) return 'modern'
  if (/Iris\s*Xe/i.test(model)) return 'older-supported'
  if (/UHD|HD Graphics/i.test(model)) return 'unsupported'
  return null
}

const TIER_RANK: Record<Tier, number> = { unsupported: 0, 'older-supported': 1, modern: 2 }

function bestTier(a: Tier | null, b: Tier | null): Tier | null {
  if (!a) return b
  if (!b) return a
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b
}

/**
 * Returns null when the raw GPU model string can't be confidently matched to a known generation —
 * silence is deliberate (no badge shown) rather than guessing at a recommendation the app can't
 * actually back up for hardware it doesn't recognize.
 */
export function getHagsRecommendation(gpuModel: string, gpuVendors: GpuVendor[]): HagsRecommendation | null {
  if (!gpuModel) return null

  let tier: Tier | null = null
  if (gpuVendors.includes('nvidia')) tier = bestTier(tier, nvidiaTier(gpuModel))
  if (gpuVendors.includes('amd')) tier = bestTier(tier, amdTier(gpuModel))
  if (gpuVendors.includes('intel')) tier = bestTier(tier, intelTier(gpuModel))
  if (!tier) return null

  if (tier === 'unsupported') {
    return {
      level: 'not-recommended',
      reason:
        "This GPU predates the driver support HAGS needs — turning it on is unlikely to do anything on hardware this old."
    }
  }
  if (tier === 'modern') {
    return {
      level: 'recommended',
      reason:
        'Modern GPU drivers assume HAGS is on. Typical gain is small (frame pacing / 1% lows more than raw FPS) and most noticeable if your CPU is the bottleneck, not your GPU.'
    }
  }
  return {
    level: 'not-recommended',
    reason:
      'Your GPU supports HAGS, but results on this generation are mixed — it can cost up to ~1GB of extra VRAM, which sometimes costs more than it gives back on older or lower-VRAM cards. Worth testing yourself rather than assuming it helps.'
  }
}
