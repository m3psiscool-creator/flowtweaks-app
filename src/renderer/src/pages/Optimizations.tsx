import { useEffect, useMemo, useState } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { CATEGORY_LABELS, type Category } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import { useScan } from '@renderer/hooks/useScan'
import { useApply } from '@renderer/hooks/useApply'
import TweakScanCard from '@renderer/components/TweakScanCard'
import ResultsReport from '@renderer/components/ResultsReport'

// Per CLAUDE.md's phased plan: enable applying one low-risk tweak at a time, not a whole
// category at once — fps-latency also contains CPU & Network Scheduling, which is HKLM,
// admin-required, and restart-required, so it stays disabled even though its category-mates
// are enabled. All three of these are HKCU-only, no-admin, no-restart, registry-only tweaks.
const APPLY_ENABLED_TWEAK_IDS = new Set(['dark-mode', 'game-mode', 'fullscreen-optimizations'])

export default function Optimizations(): React.JSX.Element {
  const { report, scanning, error, runScan } = useScan()
  const { applying, result, apply, reset } = useApply()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const resultByTweakId = useMemo(() => {
    const map = new Map<string, TweakScanResult>()
    report?.results.forEach((r) => map.set(r.tweakId, r))
    return map
  }, [report])

  const categories = useMemo(() => {
    const order: Category[] = [
      'fps-latency',
      'gpu',
      'windows-performance',
      'network',
      'background-processes',
      'startup-programs',
      'storage-cleanup',
      'game-specific',
      'personalization'
    ]
    return order
      .map((category) => ({ category, tweaks: ALL_TWEAKS.filter((t) => t.category === category) }))
      .filter((group) => group.tweaks.length > 0)
  }, [])

  function toggle(tweakId: string): void {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tweakId)) next.delete(tweakId)
      else next.add(tweakId)
      return next
    })
  }

  async function handleApply(): Promise<void> {
    await apply([...selected])
    setSelected(new Set())
    runScan()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-ft-orange">Optimizations</h1>
        <button
          type="button"
          onClick={handleApply}
          disabled={selected.size === 0 || applying}
          className="ft-heading rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {applying ? 'Applying…' : `Apply Selected (${selected.size})`}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-4">
          {result.restorePointCreated ? (
            <ResultsReport results={result.results} />
          ) : (
            <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              Nothing was applied — couldn&apos;t create a restore point first. {result.restorePointError}
            </p>
          )}
          <button type="button" onClick={reset} className="mt-2 text-xs text-white/40 underline">
            Dismiss
          </button>
        </div>
      )}

      {scanning && !report && <p className="mt-6 text-sm text-white/40">Scanning this PC…</p>}

      <div className="mt-6 flex flex-col gap-8">
        {report &&
          categories.map(({ category, tweaks }) => (
            <section key={category}>
              <h2 className="ft-heading mb-3 text-xl text-white/80">{CATEGORY_LABELS[category]}</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {tweaks.map((tweak) => {
                  const applyEnabled = APPLY_ENABLED_TWEAK_IDS.has(tweak.id)
                  return (
                    <TweakScanCard
                      key={tweak.id}
                      tweak={tweak}
                      result={resultByTweakId.get(tweak.id)}
                      applyUnavailable={!applyEnabled}
                      selection={
                        applyEnabled
                          ? {
                              selected: selected.has(tweak.id),
                              onToggle: () => toggle(tweak.id),
                              disabledReason: 'Already matches the desired state.'
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
    </div>
  )
}
