import { useEffect, useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { GAME_PROFILES } from '@data/gameProfiles'
import { CATEGORY_COLORS, type FpsImpact } from '@data/schema'
import { useScan } from '@renderer/hooks/useScan'
import Gauge from '@renderer/components/Gauge'
import { IconGamepad, IconBolt } from '@renderer/components/icons'

const IMPACT_SCORE: Record<FpsImpact, number> = { none: 0, low: 1, medium: 2, high: 3 }
const EMPHASIZE_MULTIPLIER = 1.5
// Scores above this are treated as "maxed out" for the gauge — the number itself is unbounded
// (more relevant tweaks = higher score), but the dial only needs to communicate "how full."
const GAUGE_MAX_SCORE = 14

interface Tier {
  label: string
  range: string
  colorVar: string
}

/**
 * Deliberately a range with heavy "roughly/typical" hedging, never a single number — CLAUDE.md's
 * hard rule against promising a specific FPS figure applies here more than anywhere else in the
 * app, since this whole page's job is estimating a gain that hasn't happened yet.
 */
function tierFor(score: number): Tier {
  if (score <= 0) return { label: 'Already optimized', range: 'No further predicted gain from these tweaks', colorVar: 'var(--color-status-good)' }
  if (score <= 2) return { label: 'Low potential improvement', range: 'roughly 0–5%', colorVar: 'rgba(255,255,255,0.6)' }
  if (score <= 5) return { label: 'Moderate potential improvement', range: 'roughly 5–15%', colorVar: 'var(--color-status-warning)' }
  if (score <= 8) return { label: 'High potential improvement', range: 'roughly 15–25%', colorVar: 'var(--color-status-serious)' }
  return { label: 'Very high potential improvement', range: 'roughly 25%+', colorVar: 'var(--color-status-critical)' }
}

export default function FpsEstimator(): React.JSX.Element {
  const { report, scanning, runScan } = useScan()
  const [profileId, setProfileId] = useState(GAME_PROFILES[0].id)

  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const profile = GAME_PROFILES.find((p) => p.id === profileId) ?? GAME_PROFILES[0]

  const { score, availableTweaks } = useMemo(() => {
    if (!report) return { score: 0, availableTweaks: [] as { id: string; name: string; impact: FpsImpact; category: string }[] }
    const resultByTweak = new Map(report.results.map((r) => [r.tweakId, r]))

    const relevant = ALL_TWEAKS.filter((t) => t.fpsImpact !== 'none')
    const notYetApplied = relevant.filter((t) => {
      const r = resultByTweak.get(t.id)
      // No scan result (e.g. DNS) still counts as "not yet confirmed enabled" — safer to include
      // than to silently under-count real available gains.
      return !r || r.currentState !== 'already-enabled'
    })

    let total = 0
    for (const tweak of notYetApplied) {
      const base = IMPACT_SCORE[tweak.fpsImpact]
      total += profile.emphasize.includes(tweak.category) ? base * EMPHASIZE_MULTIPLIER : base
    }

    return {
      score: total,
      availableTweaks: notYetApplied.map((t) => ({ id: t.id, name: t.name, impact: t.fpsImpact, category: t.category }))
    }
  }, [report, profile])

  const tier = tierFor(score)
  const gaugeValue = Math.min(100, (score / GAUGE_MAX_SCORE) * 100)

  return (
    <div className="max-w-2xl">
      <h1 className="flex items-center gap-3 text-4xl text-ft-orange">
        <IconBolt className="h-8 w-8" /> FPS Estimator
      </h1>
      <p className="mt-2 text-white/60">
        A rough, qualitative estimate of how much headroom is left on this PC — not a guaranteed
        number. Actual results depend entirely on your hardware and existing setup.
      </p>

      <div className="ft-glass mt-6 flex flex-wrap items-center gap-3 p-4">
        <IconGamepad className="h-5 w-5 text-ft-orange/70" />
        <label htmlFor="game-mode" className="text-sm text-white/50">
          Game mode
        </label>
        <select
          id="game-mode"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded border border-white/15 bg-black/40 px-3 py-1.5 text-sm text-white"
        >
          {GAME_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="ml-auto text-sm text-white/40 underline hover:text-white/70 disabled:opacity-40"
        >
          {scanning ? 'Scanning…' : report ? 'Rescan' : 'Scan This PC'}
        </button>
      </div>

      {!report && !scanning && (
        <p className="mt-6 text-sm text-white/40">Scan this PC to see an estimate.</p>
      )}

      {report && (
        <div className="ft-glass mt-6 p-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Gauge label="Headroom" value={gaugeValue} size={140} />
            <div className="flex-1 text-center sm:text-left">
              <p className="ft-heading text-2xl" style={{ color: tier.colorVar }}>
                {tier.label}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {tier.range} for {profile.name.toLowerCase()}
              </p>
            </div>
          </div>

          {availableTweaks.length > 0 ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs text-white/40">Based on {availableTweaks.length} not-yet-applied tweak(s):</p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm text-white/70">
                {availableTweaks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[t.category as keyof typeof CATEGORY_COLORS] }}
                      />
                      {t.name}
                    </span>
                    <span className="text-white/40 capitalize">{t.impact} impact</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 border-t border-white/10 pt-4 text-sm text-white/40">
              Every performance-relevant tweak Flow Tweaks knows about is already enabled here.
            </p>
          )}

          <p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/30">
            This estimate is a relative guide based on which tweaks are still available on this
            PC — it is not measured, benchmarked, or guaranteed. Head to Optimizations to actually
            apply anything listed here.
          </p>
        </div>
      )}
    </div>
  )
}
