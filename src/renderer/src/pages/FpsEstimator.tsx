import { useEffect, useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { GAME_PROFILES } from '@data/gameProfiles'
import { getGameSettings } from '@data/gameSettings'
import { CATEGORY_COLORS, type FpsImpact } from '@data/schema'
import { useScan } from '@renderer/hooks/useScan'
import { useAccount } from '@renderer/hooks/useAccount'
import { useAppNavigation } from '@renderer/context/AppNavigation'
import Gauge from '@renderer/components/Gauge'
import { IconGamepad, IconBolt, IconInfo, IconShield } from '@renderer/components/icons'

const IMPACT_SCORE: Record<FpsImpact, number> = { none: 0, low: 1, medium: 2, high: 3 }
// A shared ceiling across every profile, not a per-profile-normalized percentage. Normalizing by
// each profile's own theoretical max was tried first and mathematically backfired — since both
// the score and the ceiling scale with the same weights, the ratio stays roughly constant across
// profiles regardless of which game is selected, erasing exactly the differentiation this page
// needs. A shared absolute scale means a game that weights the currently-unapplied tweaks'
// categories more heavily genuinely shows a higher score than one that doesn't — verified against
// this app's real 14-tweak set: Valorant's fps-latency weight (2.0) vs Call of Duty's (1.6) on the
// same unapplied tweaks produces a real, visible tier difference, not just a different number.
const GAUGE_MAX_SCORE = 20

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
  if (score <= 4) return { label: 'Low potential improvement', range: 'roughly 0–5%', colorVar: 'rgba(255,255,255,0.6)' }
  if (score <= 9) return { label: 'Moderate potential improvement', range: 'roughly 5–15%', colorVar: 'var(--color-status-warning)' }
  if (score <= 14) return { label: 'High potential improvement', range: 'roughly 15–25%', colorVar: 'var(--color-status-serious)' }
  return { label: 'Very high potential improvement', range: 'roughly 25%+', colorVar: 'var(--color-status-critical)' }
}

export default function FpsEstimator(): React.JSX.Element {
  const { report, scanning, runScan } = useScan()
  const { session, hasLicense, loading: accountLoading, loadingTickets } = useAccount()
  const navigate = useAppNavigation()
  // This page is one of the few unlicensed accounts can see at all (UNLICENSED_ALLOWED_KEYS), so
  // the specific tweak names below have to stay locked — otherwise it's a free how-to-DIY list for
  // anyone who never buys. The gauge/tier summary above stays visible; that's the teaser.
  const canApply = session?.user.role === 'staff' || (!!session && hasLicense)
  // Not just !accountLoading — see the matching comment in Optimizations.tsx: a signed-in
  // customer's tickets can still be retrying against a cold Render backend.
  const isLocked = !accountLoading && !loadingTickets && !canApply
  const [profileId, setProfileId] = useState(GAME_PROFILES[0].id)

  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const profile = GAME_PROFILES.find((p) => p.id === profileId) ?? GAME_PROFILES[0]
  const gameSettings = getGameSettings(profileId)

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

    const total = notYetApplied.reduce(
      (sum, t) => sum + IMPACT_SCORE[t.fpsImpact] * (profile.categoryWeights[t.category] ?? 1),
      0
    )

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

      <div className="mt-6 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-white/50">
          <IconGamepad className="h-4 w-4 text-ft-orange/70" /> Click a game for its specific breakdown
        </span>
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="text-sm text-white/40 underline hover:text-white/70 disabled:opacity-40"
        >
          {scanning ? 'Scanning…' : report ? 'Rescan' : 'Scan This PC'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {GAME_PROFILES.map((p) => {
          const active = p.id === profileId
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProfileId(p.id)}
              className={`ft-heading rounded-lg border px-3.5 py-2 text-sm tracking-wide transition-all ${
                active
                  ? 'border-ft-orange bg-ft-orange/10 text-ft-orange shadow-[0_0_20px_-10px_rgba(255,85,0,0.6)]'
                  : 'ft-hoverable-subtle border-white/12 bg-white/5 text-white/70'
              }`}
            >
              {p.name}
            </button>
          )
        })}
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
              <p className="mt-2 text-xs text-white/30">{profile.description}</p>
            </div>
          </div>

          {availableTweaks.length > 0 ? (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs text-white/40">Based on {availableTweaks.length} not-yet-applied tweak(s):</p>

              {isLocked && (
                <div className="ft-glass mt-3 flex flex-wrap items-center justify-between gap-3 border-ft-orange/40 bg-ft-orange/[0.06] p-4">
                  <div className="flex items-center gap-3">
                    <IconShield className="h-5 w-5 shrink-0 text-ft-orange" />
                    <p className="text-sm text-white/60">
                      Unlock a plan to see exactly which tweaks these are.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('billing')}
                    className="ft-heading ft-btn-glow shrink-0 rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90"
                  >
                    Unlock in Billing
                  </button>
                </div>
              )}

              <ul
                className={`mt-2 flex flex-col gap-1.5 text-sm text-white/70 transition-[filter] duration-200 ${
                  isLocked ? 'pointer-events-none select-none blur-sm' : ''
                }`}
                aria-hidden={isLocked}
              >
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
            This estimate weighs each tweak by how much it typically matters for{' '}
            {profile.name.toLowerCase()}&apos;s specific CPU/GPU/network bottleneck — it is a
            relative guide, not a measured benchmark. Head to Optimizations to actually apply
            anything listed here.
          </p>
        </div>
      )}

      {gameSettings && (
        <div className="ft-glass mt-6 p-5">
          <h2 className="ft-heading text-xl text-white/80">{profile.name}: What Actually Matters</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-white/50">
            <IconInfo className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
            {gameSettings.engineNote}
          </p>

          <p className="mt-4 text-xs uppercase tracking-wide text-white/30">
            In-game settings — informational only, Flow Tweaks doesn&apos;t touch game files
          </p>
          <div className="mt-2 flex flex-col gap-2.5">
            {gameSettings.settings.map((s) => (
              <div key={s.setting} className="ft-glass-solid p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-white">{s.setting}</span>
                  <span className="ft-heading text-sm tracking-wide text-ft-orange">{s.value}</span>
                </div>
                <p className="mt-1 text-xs text-white/50">{s.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
