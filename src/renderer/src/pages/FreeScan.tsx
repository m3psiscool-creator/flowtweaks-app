import { useEffect, useMemo, useRef, useState } from 'react'
import { getTweakById } from '@data/tweaks'
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from '@data/schema'
import type { FreeScanReport } from '@shared/ipc-types'
import {
  buildFreeScanProjection,
  countAvailableByCategory,
  PROJECTION_DISCLAIMER,
  type CategoryProjection,
  type FreeScanProjection
} from '@renderer/lib/freeScan/projectionEngine'
import { buildFreeScanSubmission } from '@renderer/lib/freeScan/buildSubmission'
import { useAccount } from '@renderer/hooks/useAccount'
import { useAppNavigation } from '@renderer/context/AppNavigation'
import { IconSparkle, IconShield, IconCheckCircle, IconAlertTriangle } from '@renderer/components/icons'
import { WEBSITE_URL } from '@renderer/lib/links'

// Every category that currently has at least one real tweak, in the same order Optimizations.tsx
// uses — displaying them consistently across pages beats inventing a second ordering.
const CATEGORY_ORDER: Category[] = [
  'fps-latency',
  'input',
  'gpu',
  'windows-performance',
  'network',
  'background-processes',
  'startup-programs',
  'storage-cleanup',
  'game-specific',
  'personalization',
  'privacy-noise'
]

function formatFpsPct([lo, hi]: [number, number]): string {
  return `+${lo}% to +${hi}%`
}

/** The one place headline/category copy is generated — keeping it in one function makes it easy to
 *  audit against Section 2's banned-words rule (guarantee/guaranteed/will/promise/"up to") in one read. */
function renderHeadline(projection: FreeScanProjection): React.JSX.Element {
  if (projection.overall.kind !== 'fps') {
    // Never actually reached today (overall is always an fps-kind range), kept only so a future
    // schema change can't silently render nothing here.
    return <></>
  }

  if (!projection.matchedTier || !projection.estimatedFpsRange) {
    return (
      <p className="mt-3 text-lg text-white/70">
        We don&apos;t have enough data on your exact hardware to project a range yet. Across all
        optimized systems we typically see{' '}
        <span className="font-mono text-ft-orange">{formatFpsPct(projection.overall.avgFpsPctRange)}</span> average
        FPS.
      </p>
    )
  }

  return (
    <>
      <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/40">Estimated Fortnite FPS (Performance Mode) for your hardware</p>
      <p className="ft-heading mt-1 font-mono text-5xl text-white sm:text-6xl">
        {projection.estimatedFpsRange[0]}
        <span className="text-white/40">–</span>
        {projection.estimatedFpsRange[1]}
        <span className="ml-2 text-2xl text-white/40">fps</span>
      </p>
      {projection.projectedAvgFpsRange && (
        <p className="mt-4 text-lg text-white/70">
          Systems with similar specs typically reach{' '}
          <span className="font-mono text-ft-orange">
            {projection.projectedAvgFpsRange[0]}–{projection.projectedAvgFpsRange[1]} FPS
          </span>{' '}
          after optimization ({formatFpsPct(projection.overall.avgFpsPctRange)}).
        </p>
      )}
    </>
  )
}

interface CategorySectionProps {
  category: Category
  count: number
  rangeProjection: CategoryProjection | undefined
  tweaks: { id: string; name: string; whyItMayHelp: string }[]
  canApply: boolean
  expanded: boolean
  onToggle: () => void
  onUnlock: () => void
  onGoToOptimizations: () => void
}

function CategorySection({
  category,
  count,
  rangeProjection,
  tweaks,
  canApply,
  expanded,
  onToggle,
  onUnlock,
  onGoToOptimizations
}: CategorySectionProps): React.JSX.Element {
  return (
    <div className="ft-glass p-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="ft-heading flex items-center gap-2 text-xl text-white/80">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[category] }} />
          {CATEGORY_LABELS[category]}
        </span>
        <span className="shrink-0 text-base text-white/50">{count} available</span>
      </button>

      {rangeProjection && (
        <p className="mt-1.5 text-sm text-white/40">
          {rangeProjection.kind === 'fps'
            ? `Typical gain on systems like yours: ${formatFpsPct(rangeProjection.avgFpsPctRange)} avg FPS`
            : `Typical improvement: ${rangeProjection.latencyMsRange[0]}–${rangeProjection.latencyMsRange[1]}ms lower latency`}
        </p>
      )}

      {expanded && (
        <ul className="mt-3 flex flex-col gap-2.5 border-t border-white/10 pt-3">
          {tweaks.map((tweak) => (
            <li key={tweak.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm text-white/80">
                  {!canApply && <IconShield className="h-3.5 w-3.5 shrink-0 text-ft-orange" />}
                  {tweak.name}
                </p>
                <p className="mt-0.5 text-xs text-white/40">{tweak.whyItMayHelp}</p>
              </div>
              {!canApply && (
                <button
                  type="button"
                  onClick={onUnlock}
                  className="shrink-0 text-xs text-ft-orange underline hover:opacity-80"
                >
                  Unlock — $15
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {expanded && canApply && (
        <button
          type="button"
          onClick={onGoToOptimizations}
          className="mt-3 text-xs text-ft-orange underline hover:opacity-80"
        >
          Apply these in Optimizations →
        </button>
      )}
    </div>
  )
}

/** Fake-but-honest progress: there's no real per-step signal from the main process (the scan is one
 *  IPC round trip), so this ramps to 90% over the scan's typical real duration and snaps to 100%
 *  only once the actual promise resolves — never claims a specific step finished that didn't. */
function useScanProgress(active: boolean): number {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      setProgress(0)
      return
    }
    const start = performance.now()
    const DURATION_MS = 2600
    function tick(now: number): void {
      const elapsed = now - start
      const pct = Math.min(90, (elapsed / DURATION_MS) * 90)
      setProgress(pct)
      if (pct < 90) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  return progress
}

export default function FreeScan(): React.JSX.Element {
  const [report, setReport] = useState<FreeScanReport | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<Category>>(new Set())
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const { session, hasLicense, loading: accountLoading, loadingTickets, busy } = useAccount()
  const navigate = useAppNavigation()

  const canApply = session?.user.role === 'staff' || (!!session && hasLicense)
  const stillCheckingAccount = accountLoading || (!!session && loadingTickets)

  const fakeProgress = useScanProgress(scanning)
  const progressPct = scanning && !report ? fakeProgress : 100

  function runFreeScan(): void {
    setScanning(true)
    setScanError(null)
    window.api.freeScan
      .run()
      .then(setReport)
      .catch(() => setScanError('Scan failed. Try again.'))
      .finally(() => setScanning(false))
  }

  async function handleSendEmail(): Promise<void> {
    if (!report || !email.trim()) return
    setEmailStatus('sending')
    try {
      const submission = buildFreeScanSubmission(report, projection, availableByCategory, alreadyOptimalCount, email)
      await window.api.freeScan.submitResults(submission)
      setEmailStatus('sent')
    } catch {
      setEmailStatus('error')
    }
  }

  const availableByCategory = useMemo(
    () => (report ? countAvailableByCategory(report.scan) : {}),
    [report]
  )

  const projection = useMemo(
    () => (report ? buildFreeScanProjection(report.specs.gpuModel, availableByCategory) : null),
    [report, availableByCategory]
  )

  const totalAvailable = useMemo(
    () => Object.values(availableByCategory).reduce<number>((sum, n) => sum + (n ?? 0), 0),
    [availableByCategory]
  )

  const alreadyOptimalCount = useMemo(
    () => report?.scan.results.filter((r) => r.currentState === 'already-enabled').length ?? 0,
    [report]
  )

  const needsReviewCount = useMemo(
    () =>
      report?.scan.results.filter((r) => r.compatible && (r.currentState === 'partial' || r.currentState === 'unknown'))
        .length ?? 0,
    [report]
  )

  const categoriesWithAvailable = useMemo(
    () => CATEGORY_ORDER.filter((c) => (availableByCategory[c] ?? 0) > 0),
    [availableByCategory]
  )

  function toggleCategory(category: Category): void {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  // Nothing has run yet — one big, grand entry point. No pre-scan step to click through first.
  if (!report && !scanning) {
    return (
      <div className="flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
        <IconSparkle className="h-14 w-14 text-ft-orange" />
        <h1 className="ft-heading mt-4 text-6xl text-ft-orange sm:text-7xl">FREE SCAN</h1>
        <p className="mt-4 max-w-xl text-xl text-white/60">
          A full, in-depth diagnostic of this PC — your estimated FPS, what&apos;s available to fix,
          and what&apos;s already optimal. Nothing is changed. Free for everyone.
        </p>
        {scanError && <p className="mt-4 text-sm text-status-critical">{scanError}</p>}
        <button
          type="button"
          onClick={runFreeScan}
          className="ft-heading ft-btn-glow mt-8 rounded bg-ft-orange px-12 py-5 text-2xl tracking-wide text-ft-black transition-opacity hover:opacity-90"
        >
          Run Free Scan
        </button>
      </div>
    )
  }

  // Scanning (and no results yet) — just the bar, no visual gimmick.
  if (scanning && !report) {
    return (
      <div className="flex min-h-[70vh] max-w-xl flex-col items-center justify-center text-center">
        <IconSparkle className="h-10 w-10 text-ft-orange" />
        <p className="ft-heading mt-4 text-3xl text-white">Scanning this PC…</p>
        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-ft-orange transition-[width] duration-150"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-3 text-5xl text-ft-orange">
          <IconSparkle className="h-9 w-9" /> Free Scan
        </h1>
        <button type="button" onClick={runFreeScan} className="text-sm text-white/40 underline hover:text-white/70">
          Rescan
        </button>
      </div>
      <p className="mt-2 text-lg text-white/60">
        A full, read-only diagnostic of this PC — nothing is changed. See exactly what&apos;s
        available, how much it typically helps on hardware like yours, and what&apos;s already
        optimal.
      </p>

      {report && projection && (
        <>
          {/* Headline */}
          <div className="ft-glass mt-6 border-ft-orange/30 p-6">
            {renderHeadline(projection)}
            <p className="mt-4 text-xs text-white/40">
              Based on {projection.overall.sampleSize} comparable system
              {projection.overall.sampleSize === 1 ? '' : 's'} · your results may vary
            </p>
            <p className="mt-3 border-t border-white/10 pt-3 text-xs text-white/30">{PROJECTION_DISCLAIMER}</p>
          </div>

          <p className="ft-heading mt-5 text-2xl text-white">{totalAvailable} optimizations available</p>

          {/* Categories */}
          <div className="mt-4 flex flex-col gap-3">
            {categoriesWithAvailable.map((category) => {
              const tweaks = report.scan.results
                .filter((r) => {
                  if (!r.compatible || r.currentState === 'already-enabled') return false
                  const tweak = getTweakById(r.tweakId)
                  return tweak?.category === category
                })
                .map((r) => getTweakById(r.tweakId))
                .filter((t): t is NonNullable<typeof t> => !!t)

              const rangeProjection = projection.categories.find((p) => p.category === category)

              return (
                <CategorySection
                  key={category}
                  category={category}
                  count={availableByCategory[category] ?? 0}
                  rangeProjection={rangeProjection}
                  tweaks={tweaks}
                  canApply={canApply}
                  expanded={expanded.has(category)}
                  onToggle={() => toggleCategory(category)}
                  onUnlock={() => navigate('billing')}
                  onGoToOptimizations={() => navigate('optimizations')}
                />
              )
            })}
          </div>

          {/* Already optimal / needs review */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="ft-glass flex-1 p-4">
              <p className="ft-heading flex items-center gap-2 text-white/80">
                <IconCheckCircle className="h-5 w-5 text-status-good" /> Already Optimal
              </p>
              <p className="mt-1 text-sm text-white/50">
                {alreadyOptimalCount} check{alreadyOptimalCount === 1 ? '' : 's'} passed — already
                configured correctly.
              </p>
            </div>
            {needsReviewCount > 0 && (
              <div className="ft-glass flex-1 p-4">
                <p className="ft-heading flex items-center gap-2 text-white/80">
                  <IconAlertTriangle className="h-5 w-5 text-status-warning" /> Needs Manual Review
                </p>
                <p className="mt-1 text-sm text-white/50">
                  {needsReviewCount} unusual setting{needsReviewCount === 1 ? '' : 's'} we can&apos;t
                  safely automate.
                </p>
              </div>
            )}
          </div>

          {/* Conversion */}
          {!stillCheckingAccount && !canApply && (
            <div className="ft-glass mt-6 border-ft-orange/40 bg-ft-orange/[0.06] p-5">
              <p className="ft-heading text-xl text-ft-orange">Unlock every tweak on this PC</p>
              <p className="mt-2 text-sm text-white/60">
                PC package — $15, one-time, no subscription. {session ? '' : 'Sign in from the Account tab, then unlock.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('billing')}
                disabled={busy}
                className="ft-heading ft-btn-glow mt-3 rounded bg-ft-orange px-5 py-2.5 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Unlock in Billing
              </button>
              <p className="mt-2 text-xs text-white/40">
                Console tweaks ($5) are handled through{' '}
                <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="text-ft-orange underline">
                  flowtweaks.com
                </a>{' '}
                and Discord — no Windows app needed for those.
              </p>
            </div>
          )}
          {!stillCheckingAccount && canApply && (
            <div className="ft-glass mt-6 border-status-good/30 p-5">
              <p className="ft-heading flex items-center gap-2 text-xl text-status-good">
                <IconShield className="h-5 w-5" /> You already own this
              </p>
              <p className="mt-2 text-sm text-white/60">
                Head to Optimizations to apply everything found above.
              </p>
              <button
                type="button"
                onClick={() => navigate('optimizations')}
                className="ft-heading ft-btn-glow mt-3 rounded bg-ft-orange px-5 py-2.5 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90"
              >
                Go to Optimizations
              </button>
            </div>
          )}

          {/* Email capture — optional, skippable, never gates anything above */}
          <div className="ft-glass mt-6 p-5">
            <p className="ft-heading text-lg text-white">Email me my results</p>
            <p className="mt-1 text-sm text-white/50">
              Optional — get a copy of what was found, plus anything new we add for your specific
              hardware later. Never spam.
            </p>
            {emailStatus === 'sent' ? (
              <p className="mt-3 text-sm text-status-good">Sent — check your inbox.</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={!email.trim() || emailStatus === 'sending'}
                  className="ft-heading rounded border border-ft-orange/60 px-4 py-2 text-sm tracking-wide text-ft-orange transition-opacity hover:bg-ft-orange/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {emailStatus === 'sending' ? 'Sending…' : 'Send'}
                </button>
              </div>
            )}
            {emailStatus === 'error' && (
              <p className="mt-2 text-xs text-status-warning">
                Couldn&apos;t reach the server right now — your results above are unaffected, try
                again in a bit.
              </p>
            )}
          </div>
        </>
      )}

      {scanError && report === null && <p className="mt-4 text-sm text-status-critical">{scanError}</p>}
    </div>
  )
}
