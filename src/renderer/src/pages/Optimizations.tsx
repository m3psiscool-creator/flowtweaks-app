import { useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS } from '@data/applyEnabled'
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import TweakScanCard from '@renderer/components/TweakScanCard'
import ResultsReport from '@renderer/components/ResultsReport'
import DnsOverrideModal from '@renderer/components/DnsOverrideModal'

export default function Optimizations(): React.JSX.Element {
  const { report, scanning, error, runScan } = useScan()
  const { applying, result, apply, reset } = useApply()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dnsOverrideConfirmed, setDnsOverrideConfirmed] = useState(false)
  const [dnsOverrideModalOpen, setDnsOverrideModalOpen] = useState(false)

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
      .map((category) => ({ category, tweaks: ALL_TWEAKS.filter((t) => t.category === category) }))
      .filter((group) => group.tweaks.length > 0)
  }, [])

  // Everything a click-to-select card could actually select right now: apply-enabled and — per
  // TweakScanCard's own canSelect gate — compatible, not already-enabled, and not blocked on
  // elevation. Run All reuses this exact set instead of guessing at eligibility separately, so
  // "select everything selectable" and "Run All" can never disagree.
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

  function toggle(tweakId: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tweakId)) next.delete(tweakId)
      else next.add(tweakId)
      return next
    })
  }

  function cancelDnsOverride(): void {
    setDnsOverrideConfirmed(false)
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete('dns-cloudflare')
      return next
    })
  }

  function confirmDnsOverride(): void {
    setDnsOverrideConfirmed(true)
    setSelected((prev) => new Set(prev).add('dns-cloudflare'))
    setDnsOverrideModalOpen(false)
  }

  async function runApply(tweakIds: string[]): Promise<void> {
    // allowDnsOverride only ever comes from this one explicit, single-use confirmation — never a
    // default, never something Run All could accidentally sweep in.
    await apply(tweakIds, { allowDnsOverride: dnsOverrideConfirmed })
    setSelected(new Set())
    setDnsOverrideConfirmed(false)
    runScan()
  }

  const handleApplySelected = (): Promise<void> => runApply([...selected])
  const handleRunAll = (): Promise<void> => runApply([...selectableTweakIds])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-ft-orange">Optimizations</h1>
        <div className="flex items-center gap-3">
          {report && (
            <button
              type="button"
              onClick={runScan}
              disabled={scanning || applying}
              className="text-sm text-white/40 underline hover:text-white/70 disabled:opacity-40"
            >
              Rescan
            </button>
          )}
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={applying}
              className="ft-heading rounded border border-ft-orange px-4 py-2 text-sm tracking-wide text-ft-orange transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {applying ? 'Applying…' : `Apply Selected (${selected.size})`}
            </button>
          )}
          {report && (
            <button
              type="button"
              onClick={handleRunAll}
              disabled={applying || selectableTweakIds.size === 0}
              className="ft-heading ft-btn-glow rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {applying ? 'Applying…' : `Run All (${selectableTweakIds.size})`}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-status-critical">{error}</p>}

      {report && !report.isElevated && (
        <p className="ft-glass mt-4 border-status-warning/30 p-3 text-sm text-status-warning">
          Not running as administrator — tweaks marked &quot;Needs Admin&quot; can be scanned but
          won&apos;t be applicable until Flow Tweaks is relaunched elevated.
        </p>
      )}

      {result && (
        <div className="mt-4">
          {result.restorePointCreated ? (
            <ResultsReport results={result.results} />
          ) : (
            <p className="ft-glass border-status-critical/30 p-3 text-sm text-status-critical">
              Nothing was applied — couldn&apos;t create a restore point first. {result.restorePointError}
            </p>
          )}
          <button type="button" onClick={reset} className="mt-2 text-xs text-white/40 underline">
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
                  const applyEnabled = APPLY_ENABLED_TWEAK_IDS.has(tweak.id)
                  const tweakResult = resultByTweakId.get(tweak.id)
                  return (
                    <TweakScanCard
                      key={tweak.id}
                      tweak={tweak}
                      result={tweakResult}
                      selection={
                        applyEnabled
                          ? {
                              selected: selected.has(tweak.id),
                              onToggle: () => toggle(tweak.id),
                              disabledReason: 'Already matches the desired state.'
                            }
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
