import { useMemo } from 'react'
import { ALL_TWEAKS } from '@data/tweaks'
import { CATEGORY_LABELS, type Category } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import { useScan } from '@renderer/hooks/useScan'
import TweakScanCard from '@renderer/components/TweakScanCard'

export default function Scan(): React.JSX.Element {
  const { report, scanning, error, runScan } = useScan()

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
      .map((category) => ({
        category,
        tweaks: ALL_TWEAKS.filter((t) => t.category === category)
      }))
      .filter((group) => group.tweaks.length > 0)
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl text-ft-orange">Scan</h1>
        <button
          type="button"
          onClick={runScan}
          disabled={scanning}
          className="ft-heading rounded bg-ft-orange px-5 py-2 text-lg tracking-wide text-ft-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {scanning ? 'Scanning…' : report ? 'Rescan' : 'Scan This PC'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {report && !report.isElevated && (
        <p className="mt-4 rounded border border-ft-orange/30 bg-ft-orange/10 p-3 text-sm text-ft-orange">
          Not running as administrator — tweaks marked &quot;Needs Admin&quot; can be scanned but
          won&apos;t be applicable until Flow Tweaks is relaunched elevated.
        </p>
      )}

      {!report && !scanning && (
        <p className="mt-6 text-sm text-white/40">
          Nothing scanned yet. This only reads your PC&apos;s current settings — nothing is
          changed.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-8">
        {report &&
          categories.map(({ category, tweaks }) => (
            <section key={category}>
              <h2 className="ft-heading mb-3 text-xl text-white/80">{CATEGORY_LABELS[category]}</h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {tweaks.map((tweak) => (
                  <TweakScanCard key={tweak.id} tweak={tweak} result={resultByTweakId.get(tweak.id)} />
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
