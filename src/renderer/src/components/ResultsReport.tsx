import type { TweakApplyResult } from '@shared/ipc-types'
import { getTweakById } from '@data/tweaks'

interface ResultsReportProps {
  results: TweakApplyResult[]
}

const OUTCOME_LABELS: Record<TweakApplyResult['outcome'], string> = {
  applied: 'applied successfully',
  'already-enabled': 'already enabled',
  'skipped-incompatible': 'skipped — not compatible',
  failed: 'failed',
  'needs-manual-review': 'needs manual review'
}

export default function ResultsReport({ results }: ResultsReportProps): React.JSX.Element {
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <ul className="flex flex-col gap-1 text-sm">
        {Object.entries(counts).map(([outcome, count]) => (
          <li key={outcome} className="text-white/80">
            {count} tweak{count === 1 ? '' : 's'} {OUTCOME_LABELS[outcome as TweakApplyResult['outcome']]}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3">
        {results.map((r) => (
          <div key={r.tweakId} className="text-xs text-white/40">
            <span className="text-white/60">{getTweakById(r.tweakId)?.name ?? r.tweakId}:</span>{' '}
            {OUTCOME_LABELS[r.outcome]}
            {r.detail ? ` — ${r.detail}` : ''}
          </div>
        ))}
      </div>
    </div>
  )
}
