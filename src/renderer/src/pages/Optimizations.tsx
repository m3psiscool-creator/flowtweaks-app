import { useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { APPLY_ENABLED_TWEAK_IDS, DISABLE_ENABLED_TWEAK_IDS } from '@data/applyEnabled'
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import { useDisable } from '@renderer/hooks/useDisable'
import TweakScanCard from '@renderer/components/TweakScanCard'
import ResultsReport from '@renderer/components/ResultsReport'
import DnsOverrideModal from '@renderer/components/DnsOverrideModal'

export default function Optimizations(): React.JSX.Element {
  const { report, scanning, error, runScan } = useScan()
  const { applying, result: applyResult, apply, reset: resetApply } = useApply()
  const { disabling, result: disableResult, disable, reset: resetDisable } = useDisable()
  const [activeTweakId, setActiveTweakId] = useState<string | null>(null)
  const [dnsOverrideConfirmed, setDnsOverrideConfirmed] = useState(false)
  const [dnsOverrideModalOpen, setDnsOverrideModalOpen] = useState(false)

  const anyBusy = applying || disabling

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

  // Everything Run All can bulk-enable right now: apply-enabled, compatible, not blocked on
  // elevation, not already on. Toggling individual tweaks on/off is handled per-card instead —
  // Run All stays purely a bulk-enable shortcut, it never turns anything off.
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

  async function runToggleAction(tweakId: string, action: 'enable' | 'disable'): Promise<void> {
    setActiveTweakId(tweakId)
    resetApply()
    resetDisable()
    if (action === 'enable') {
      await apply([tweakId], tweakId === 'dns-cloudflare' ? { allowDnsOverride: dnsOverrideConfirmed } : undefined)
    } else {
      await disable([tweakId])
    }
    setDnsOverrideConfirmed(false)
    setActiveTweakId(null)
    runScan()
  }

  function cancelDnsOverride(): void {
    setDnsOverrideConfirmed(false)
    setDnsOverrideModalOpen(false)
  }

  async function confirmDnsOverride(): Promise<void> {
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

  async function handleRunAll(): Promise<void> {
    setActiveTweakId(null)
    resetApply()
    resetDisable()
    await apply([...selectableTweakIds])
    runScan()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-ft-orange">Optimizations</h1>
        <div className="flex items-center gap-3">
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
              onClick={handleRunAll}
              disabled={anyBusy || selectableTweakIds.size === 0}
              className="ft-heading ft-btn-glow rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {applying && !activeTweakId ? 'Applying…' : `Run All (${selectableTweakIds.size})`}
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-white/40">
        Flip a switch to turn a tweak on or off directly — Run All enables everything available at once.
      </p>

      {error && <p className="mt-4 text-sm text-status-critical">{error}</p>}

      {report && !report.isElevated && (
        <p className="ft-glass mt-4 border-status-warning/30 p-3 text-sm text-status-warning">
          Not running as administrator — tweaks marked &quot;Needs Admin&quot; can be scanned but
          won&apos;t be applicable until Flow Tweaks is relaunched elevated.
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
                  const applyEnabled = APPLY_ENABLED_TWEAK_IDS.has(tweak.id)
                  const tweakResult = resultByTweakId.get(tweak.id)
                  return (
                    <TweakScanCard
                      key={tweak.id}
                      tweak={tweak}
                      result={tweakResult}
                      toggle={
                        applyEnabled
                          ? {
                              onEnable: () => runToggleAction(tweak.id, 'enable'),
                              onDisable: () => runToggleAction(tweak.id, 'disable'),
                              busy: activeTweakId === tweak.id,
                              disabled: anyBusy && activeTweakId !== tweak.id,
                              canDisable: DISABLE_ENABLED_TWEAK_IDS.has(tweak.id)
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
