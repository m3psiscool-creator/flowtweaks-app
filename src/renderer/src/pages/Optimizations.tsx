import { useEffect, useMemo, useState } from 'react'
import { ALL_TWEAKS, getTweakById } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS, DISABLE_ENABLED_TWEAK_IDS } from '@data/applyEnabled'
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type RiskLevel } from '@data/schema'
import type { BaselineMeasurement, TweakScanResult } from '@shared/ipc-types'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import { useDisable } from '@renderer/hooks/useDisable'
import { useAccount } from '@renderer/hooks/useAccount'
import { useAppNavigation } from '@renderer/context/AppNavigation'
import TweakScanCard from '@renderer/components/TweakScanCard'
import ResultsReport from '@renderer/components/ResultsReport'
import DnsOverrideModal from '@renderer/components/DnsOverrideModal'
import BenchmarkOverlay from '@renderer/components/BenchmarkOverlay'
import type { BenchmarkOutcome } from '@renderer/lib/benchmark/runBenchmark'
import { IconShield, IconSparkle } from '@renderer/components/icons'
import { REFERRAL_URL } from '@renderer/lib/links'
import { RISK_LABELS } from '@renderer/lib/tweakDisplay'
import { getHagsRecommendation } from '@renderer/lib/hagsRecommendation'
import { getUlpsRecommendation } from '@renderer/lib/ulpsRecommendation'
import { useSystemInfo } from '@renderer/hooks/useSystemInfo'

const RISK_FILTERS: Array<'all' | RiskLevel> = ['all', 'low', 'medium', 'high']

export default function Optimizations(): React.JSX.Element {
  const { report, scanning, error, runScan } = useScan()
  const { applying, result: applyResult, apply, reset: resetApply } = useApply()
  const { disabling, result: disableResult, disable, reset: resetDisable } = useDisable()
  const { session, hasLicense, loading: accountLoading, loadingTickets } = useAccount()
  const navigate = useAppNavigation()
  const [activeTweakId, setActiveTweakId] = useState<string | null>(null)
  const [dnsOverrideConfirmed, setDnsOverrideConfirmed] = useState(false)
  const [dnsOverrideModalOpen, setDnsOverrideModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const { specs } = useSystemInfo()
  const [priorBaseline, setPriorBaseline] = useState<BaselineMeasurement | null>(null)
  const [measuring, setMeasuring] = useState(false)
  const [measureStatus, setMeasureStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  const anyBusy = applying || disabling
  // Staff can freely test tweaks for support purposes; customers need a pc/both ticket. Scanning
  // stays open to everyone — seeing what you'd get is fine, changing the PC is the gated part.
  const canApply = session?.user.role === 'staff' || (!!session && hasLicense)
  // Not just !accountLoading — a signed-in customer's tickets can still be mid-retry against a
  // cold Render backend (see useAccount's TICKET_RETRY_DELAYS_MS). Locking during that window
  // would show "you need to buy" to someone who's already paid, indistinguishable from being
  // signed out.
  const isLocked = !accountLoading && !loadingTickets && !canApply

  const hagsRecommendation = useMemo(() => {
    if (!specs) return null
    return getHagsRecommendation(specs.gpuModel, specs.gpuVendors)
  }, [specs])

  const ulpsRecommendation = useMemo(() => {
    if (!specs) return null
    return getUlpsRecommendation(specs.gpuCount)
  }, [specs])

  // Phase 7 (CLAUDE-free-scan.md): once something real got applied, offer to re-measure against
  // the baseline Free Scan already captured — but only if that baseline is a real benchmark, never
  // a percentage-only fallback, since there'd be nothing numeric to compare against.
  const appliedTweakIds = useMemo(
    () => applyResult?.results.filter((r) => r.outcome === 'applied').map((r) => r.tweakId) ?? [],
    [applyResult]
  )
  const appliedNeedsRestart = useMemo(
    () => appliedTweakIds.some((id) => getTweakById(id)?.requiresRestart),
    [appliedTweakIds]
  )

  useEffect(() => {
    if (applyResult?.restorePointCreated && appliedTweakIds.length > 0) {
      window.api.freeScan.getLatestBaseline().then(setPriorBaseline)
      setMeasureStatus('idle')
    }
  }, [applyResult, appliedTweakIds])

  async function handleMeasurementComplete(outcome: BenchmarkOutcome): Promise<void> {
    setMeasuring(false)
    if (!outcome.ok) return // Nothing usable to compare or store — same "never fabricate" rule as everywhere else.

    const after = await window.api.freeScan.recordBaseline({
      method: 'webgl-benchmark',
      avgFps: outcome.stats.avgFps,
      onePercentLowFps: outcome.stats.onePercentLowFps,
      sampleCount: outcome.stats.sampleCount
    })

    if (priorBaseline?.method !== 'webgl-benchmark' || priorBaseline.avgFps === null || !specs) return

    setMeasureStatus('submitting')
    try {
      await window.api.freeScan.submitBeforeAfter({
        cpu_model: specs.cpuModel,
        gpu_model: specs.gpuModel,
        ram_total_bytes: specs.ramTotalBytes,
        windows_version: specs.windowsVersion,
        before_avg_fps: priorBaseline.avgFps,
        before_one_percent_low_fps: priorBaseline.onePercentLowFps ?? undefined,
        before_sample_count: priorBaseline.sampleCount,
        after_avg_fps: after.avgFps!,
        after_one_percent_low_fps: after.onePercentLowFps ?? undefined,
        after_sample_count: after.sampleCount,
        applied_tweak_ids: appliedTweakIds,
        applied_categories: [
          ...new Set(appliedTweakIds.map((id) => getTweakById(id)?.category).filter((c): c is Category => !!c))
        ]
      })
      setMeasureStatus('done')
    } catch {
      setMeasureStatus('error')
    }
  }

  const resultByTweakId = useMemo(() => {
    const map = new Map<string, TweakScanResult>()
    report?.results.forEach((r) => map.set(r.tweakId, r))
    return map
  }, [report])

  const categories = useMemo(() => {
    const order: Category[] = [
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
    return order
      .map((category) => ({
        category,
        tweaks: ALL_TWEAKS.filter((t) => t.category === category && (riskFilter === 'all' || t.riskLevel === riskFilter))
      }))
      .filter((group) => group.tweaks.length > 0)
  }, [riskFilter])

  // Everything that can be picked for a fresh apply right now: apply-enabled, compatible, not
  // blocked on elevation, not already on. Both "Apply Selected" and "Apply All" draw from this —
  // Apply All is just "select everything in this set," Apply Selected is whatever the customer
  // picked by hand. Neither one ever turns anything off — that's the separate "Turn off" action.
  const selectableTweakIds = useMemo(() => {
    if (!report) return new Set<string>()
    return new Set(
      ALL_TWEAKS.filter((tweak) => {
        if (!APPLY_ENABLED_TWEAK_IDS.has(tweak.id)) return false
        const r = resultByTweakId.get(tweak.id)
        return (r?.compatible ?? true) && !r?.needsElevation && r?.currentState !== 'already-enabled'
      }).map((t) => t.id)
    )
  }, [report, resultByTweakId])

  // Selections can go stale across a rescan (a tweak that was selectable a moment ago might now
  // read as already-enabled, or a fresh scan might drop it entirely) — prune anything that's no
  // longer in the selectable set so the count shown on "Apply Selected" is always honest.
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => selectableTweakIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [selectableTweakIds])

  function toggleSelected(tweakId: string): void {
    if (!selectableTweakIds.has(tweakId) || anyBusy) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tweakId)) next.delete(tweakId)
      else next.add(tweakId)
      return next
    })
  }

  async function runDisable(tweakId: string): Promise<void> {
    if (!canApply) return
    setActiveTweakId(tweakId)
    resetApply()
    resetDisable()
    await disable([tweakId])
    setActiveTweakId(null)
    runScan()
  }

  function cancelDnsOverride(): void {
    setDnsOverrideConfirmed(false)
    setDnsOverrideModalOpen(false)
  }

  async function confirmDnsOverride(): Promise<void> {
    if (!canApply) return
    setDnsOverrideConfirmed(true)
    setDnsOverrideModalOpen(false)
    setActiveTweakId('dns-cloudflare')
    resetApply()
    resetDisable()
    await apply(['dns-cloudflare'], { allowDnsOverride: true })
    setDnsOverrideConfirmed(false)
    setActiveTweakId(null)
    runScan()
  }

  async function handleApplySelected(): Promise<void> {
    if (!canApply) return
    const ids = [...selectedIds].filter((id) => selectableTweakIds.has(id))
    if (ids.length === 0) return
    setActiveTweakId(null)
    resetApply()
    resetDisable()
    await apply(ids)
    setSelectedIds(new Set())
    runScan()
  }

  async function handleApplyAll(): Promise<void> {
    if (!canApply) return
    setActiveTweakId(null)
    resetApply()
    resetDisable()
    await apply([...selectableTweakIds])
    setSelectedIds(new Set())
    runScan()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl text-ft-orange">Optimizations</h1>
        <div className="flex flex-wrap items-center gap-3">
          {report && (
            <button
              type="button"
              onClick={runScan}
              disabled={scanning || anyBusy}
              className="text-sm text-white/40 underline hover:text-white/70 disabled:opacity-40"
            >
              Rescan
            </button>
          )}
          {report && (
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={!canApply || anyBusy || selectedIds.size === 0}
              className="ft-heading rounded border border-ft-orange/60 px-5 py-2 text-lg tracking-wide text-ft-orange transition-opacity hover:bg-ft-orange/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {applying && selectedIds.size > 0 ? 'Applying…' : `Apply Selected (${selectedIds.size})`}
            </button>
          )}
          {report && (
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={!canApply || anyBusy || selectableTweakIds.size === 0}
              className="ft-heading ft-btn-glow rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {applying && selectedIds.size === 0 ? 'Applying…' : `Apply All (${selectableTweakIds.size})`}
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-white/40">
        Click a card to select it, pick as many as you want, then Apply Selected — or Apply All to
        run everything available at once. Already-enabled tweaks show a Turn off link instead.
      </p>

      {report && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-white/40">Risk:</span>
          {RISK_FILTERS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRiskFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                riskFilter === r
                  ? 'bg-ft-orange text-ft-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
              }`}
            >
              {r === 'all' ? 'All' : RISK_LABELS[r]}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-status-critical">{error}</p>}

      {report && !report.isElevated && (
        <p className="ft-glass mt-4 border-status-warning/30 p-3 text-sm text-status-warning">
          Not running as administrator — tweaks marked &quot;Needs Admin&quot; can be scanned but
          won&apos;t be applicable until Flow Tweaks is relaunched elevated.
        </p>
      )}

      {isLocked && (
        <div className="ft-glass mt-4 flex flex-wrap items-center justify-between gap-3 border-ft-orange/40 bg-ft-orange/[0.06] p-4">
          <div className="flex items-center gap-3">
            <IconShield className="h-6 w-6 shrink-0 text-ft-orange" />
            <div>
              <p className="ft-heading text-base text-ft-orange">This account is locked</p>
              <p className="text-sm text-white/60">
                {session
                  ? "You're signed in, but this account hasn't unlocked a plan yet."
                  : 'Sign in from the Account tab, then unlock a plan to start applying tweaks.'}
              </p>
              <a
                href={REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-sm text-ft-orange underline hover:opacity-80"
              >
                Or earn it free — refer friends and redeem points for a plan
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('billing')}
            className="ft-heading ft-btn-glow shrink-0 rounded bg-ft-orange px-5 py-2.5 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90"
          >
            Unlock in Billing
          </button>
        </div>
      )}

      {(applyResult || disableResult) && (
        <div className="mt-4">
          {applyResult && !applyResult.restorePointCreated && (
            <p className="ft-glass border-status-critical/30 p-3 text-sm text-status-critical">
              Nothing was applied — couldn&apos;t create a restore point first. {applyResult.restorePointError}
            </p>
          )}
          {disableResult && !disableResult.restorePointCreated && (
            <p className="ft-glass border-status-critical/30 p-3 text-sm text-status-critical">
              Nothing was turned off — couldn&apos;t create a restore point first. {disableResult.restorePointError}
            </p>
          )}
          {applyResult?.restorePointCreated && <ResultsReport results={applyResult.results} />}
          {disableResult?.restorePointCreated && <ResultsReport results={disableResult.results} />}

          {applyResult?.restorePointCreated && appliedTweakIds.length > 0 && priorBaseline?.method === 'webgl-benchmark' && (
            <div className="ft-glass mt-3 border-ft-orange/30 p-4">
              <p className="ft-heading flex items-center gap-2 text-base text-white">
                <IconSparkle className="h-4 w-4 text-ft-orange" /> Measure your real improvement
              </p>
              <p className="mt-1 text-sm text-white/60">
                {appliedNeedsRestart
                  ? "Some of what you applied needs a restart to fully take effect — for the most accurate number, restart first, then come back and measure."
                  : 'Re-runs the same benchmark from Free Scan so you can see your actual before/after gain.'}
              </p>
              {measureStatus === 'done' ? (
                <p className="mt-2 text-sm text-status-good">
                  Measured — your new baseline is saved, and shared anonymously to help improve
                  future estimates for hardware like yours.
                </p>
              ) : measureStatus === 'error' ? (
                <p className="mt-2 text-sm text-white/60">
                  Measured — your new baseline is saved locally, but couldn&apos;t reach the server
                  to share it right now.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setMeasuring(true)}
                  disabled={measuring}
                  className="ft-heading ft-btn-glow mt-3 rounded bg-ft-orange px-4 py-2 text-sm tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Measure My Improvement
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              resetApply()
              resetDisable()
            }}
            className="mt-2 text-xs text-white/40 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!report && !scanning && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="max-w-md text-sm text-white/50">
            Flow Tweaks reads your PC&apos;s current settings first — nothing is changed until you
            choose to apply something.
          </p>
          <button
            type="button"
            onClick={runScan}
            className="ft-heading ft-btn-glow rounded bg-ft-orange px-8 py-3 text-xl tracking-wide text-ft-black transition-opacity hover:opacity-90"
          >
            Scan To See Optimizations
          </button>
        </div>
      )}

      {scanning && !report && <p className="mt-16 text-center text-sm text-white/40">Scanning this PC…</p>}

      <div
        className={`mt-6 flex flex-col gap-8 transition-[filter] duration-200 ${
          isLocked && report ? 'pointer-events-none select-none blur-sm' : ''
        }`}
        aria-hidden={isLocked && !!report}
      >
        {report &&
          categories.map(({ category, tweaks }) => (
            <section key={category}>
              <h2 className="ft-heading mb-3 flex items-center gap-2 text-xl text-white/80">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[category] }}
                />
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {tweaks.map((tweak) => {
                  const tweakResult = resultByTweakId.get(tweak.id)
                  const alreadyEnabled = tweakResult?.currentState === 'already-enabled'
                  const canDisable = DISABLE_ENABLED_TWEAK_IDS.has(tweak.id)
                  return (
                    <TweakScanCard
                      key={tweak.id}
                      tweak={tweak}
                      result={tweakResult}
                      selectable={selectableTweakIds.has(tweak.id) && canApply}
                      selected={selectedIds.has(tweak.id)}
                      onToggleSelect={() => toggleSelected(tweak.id)}
                      disableAction={
                        alreadyEnabled && canDisable
                          ? {
                              onDisable: () => runDisable(tweak.id),
                              busy: activeTweakId === tweak.id,
                              disabled: !canApply || (anyBusy && activeTweakId !== tweak.id)
                            }
                          : undefined
                      }
                      recommendation={
                        tweak.id === 'hags'
                          ? (hagsRecommendation ?? undefined)
                          : tweak.id === 'amd-disable-ulps'
                            ? (ulpsRecommendation ?? undefined)
                            : undefined
                      }
                      override={
                        tweakResult?.overrideAvailable
                          ? {
                              confirmed: dnsOverrideConfirmed,
                              onStart: () => setDnsOverrideModalOpen(true),
                              onCancel: cancelDnsOverride
                            }
                          : undefined
                      }
                    />
                  )
                })}
              </div>
            </section>
          ))}
      </div>

      {dnsOverrideModalOpen && (
        <DnsOverrideModal
          tweakId="dns-cloudflare"
          onConfirm={confirmDnsOverride}
          onCancel={() => setDnsOverrideModalOpen(false)}
        />
      )}

      {measuring && (
        <BenchmarkOverlay onComplete={handleMeasurementComplete} onCancel={() => setMeasuring(false)} />
      )}
    </div>
  )
}
