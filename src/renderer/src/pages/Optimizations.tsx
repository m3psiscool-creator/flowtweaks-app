import { useEffect, useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS, DISABLE_ENABLED_TWEAK_IDS } from '@data/applyEnabled'
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type RiskLevel } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import { useDisable } from '@renderer/hooks/useDisable'
import { useAccount } from '@renderer/hooks/useAccount'
import TweakScanCard from '@renderer/components/TweakScanCard'
import ResultsReport from '@renderer/components/ResultsReport'
import DnsOverrideModal from '@renderer/components/DnsOverrideModal'
import { RISK_LABELS } from '@renderer/lib/tweakDisplay'
import { getHagsRecommendation } from '@renderer/lib/hagsRecommendation'
import { getUlpsRecommendation } from '@renderer/lib/ulpsRecommendation'
import { useSystemInfo } from '@renderer/hooks/useSystemInfo'

const RISK_FILTERS: Array<'all' | RiskLevel> = ['all', 'low', 'medium', 'high']

export default function Optimizations(): React.JSX.Element {
  const { report, scanning, error, runScan } = useScan()
  const { applying, result: applyResult, apply, reset: resetApply } = useApply()
  const { disabling, result: disableResult, disable, reset: resetDisable } = useDisable()
  const { session, hasLicense, loading: accountLoading } = useAccount()
  const [activeTweakId, setActiveTweakId] = useState<string | null>(null)
  const [dnsOverrideConfirmed, setDnsOverrideConfirmed] = useState(false)
  const [dnsOverrideModalOpen, setDnsOverrideModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all')
  const { specs } = useSystemInfo()

  const anyBusy = applying || disabling
  // Staff can freely test tweaks for support purposes; customers need a pc/both ticket. Scanning
  // stays open to everyone — seeing what you'd get is fine, changing the PC is the gated part.
  const canApply = session?.user.role === 'staff' || (!!session && hasLicense)

  const hagsRecommendation = useMemo(() => {
    if (!specs) return null
    return getHagsRecommendation(specs.gpuModel, specs.gpuVendors)
  }, [specs])

  const ulpsRecommendation = useMemo(() => {
    if (!specs) return null
    return getUlpsRecommendation(specs.gpuCount)
  }, [specs])

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

      {report && !accountLoading && !canApply && (
        <p className="ft-glass mt-4 border-ft-orange/30 p-3 text-sm text-white/70">
          <span className="text-ft-orange font-semibold">Locked.</span>{' '}
          {session
            ? "This account doesn't have an unlock yet — buy a plan or redeem an access code from the Account tab to start applying tweaks."
            : 'Sign in and unlock a plan from the Account tab to start applying tweaks.'}
        </p>
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

      <div className="mt-6 flex flex-col gap-8">
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
    </div>
  )
}
