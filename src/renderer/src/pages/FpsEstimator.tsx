import { useEffect, useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { GAME_PROFILES } from '@data/gameProfiles'
import type { FpsImpact } from '@data/schema'
import { useScan } from '@renderer/hooks/useScan'

const IMPACT_SCORE: Record<FpsImpact, number> = { none: 0, low: 1, medium: 2, high: 3 }
const EMPHASIZE_MULTIPLIER = 1.5

interface Tier {
  label: string
  range: string
  className: string
}

/**
 * Deliberately a range with heavy "roughly/typical" hedging, never a single number — CLAUDE.md's
 * hard rule against promising a specific FPS figure applies here more than anywhere else in the
 * app, since this whole page's job is estimating a gain that hasn't happened yet.
 */
function tierFor(score: number): Tier {
  if (score <= 0) return { label: 'Already optimized', range: 'No further predicted gain from these tweaks', className: 'text-white/50' }
  if (score <= 2) return { label: 'Low potential improvement', range: 'roughly 0–5%', className: 'text-white/70' }
  if (score <= 5) return { label: 'Moderate potential improvement', range: 'roughly 5–15%', className: 'text-yellow-400' }
  if (score <= 8) return { label: 'High potential improvement', range: 'roughly 15–25%', className: 'text-ft-orange' }
  return { label: 'Very high potential improvement', range: 'roughly 25%+', className: 'text-ft-orange' }
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
    if (!report) return { score: 0, availableTweaks: [] as { id: string; name: string; impact: FpsImpact }[] }
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
      availableTweaks: notYetApplied.map((t) => ({ id: t.id, name: t.name, impact: t.fpsImpact }))
    }
  }, [report, profile])

  const tier = tierFor(score)

  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl text-ft-orange">FPS Estimator</h1>
      <p className="mt-2 text-white/60">
        A rough, qualitative estimate of how much headroom is left on this PC — not a guaranteed
        number. Actual results depend entirely on your hardware and existing setup.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="game-mode" className="text-sm text-white/50">
          Game mode
        </label>
        <select
          id="game-mode"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded border border-white/10 bg-ft-black px-3 py-1.5 text-sm text-white"
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
          className="text-sm text-white/40 underline hover:text-white/70 disabled:opacity-40"
        >
          {scanning ? 'Scanning…' : report ? 'Rescan' : 'Scan This PC'}
        </button>
      </div>

      {!report && !scanning && (
        <p className="mt-6 text-sm text-white/40">Scan this PC to see an estimate.</p>
      )}

      {report && (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-5">
          <p className={`ft-heading text-2xl ${tier.className}`}>{tier.label}</p>
          <p className="mt-1 text-sm text-white/50">{tier.range} for {profile.name.toLowerCase()}</p>

          {availableTweaks.length > 0 ? (
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="text-xs text-white/40">Based on {availableTweaks.length} not-yet-applied tweak(s):</p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-white/70">
                {availableTweaks.map((t) => (
                  <li key={t.id} className="flex justify-between">
                    <span>{t.name}</span>
                    <span className="text-white/40 capitalize">{t.impact} impact</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/40">
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
