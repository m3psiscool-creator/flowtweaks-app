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

// Same validated status palette as risk/state pills — applied outcomes read as good, failures as
// critical, review/skip states sit between, all at a glance instead of every line being white.
const OUTCOME_CLASSES: Record<TweakApplyResult['outcome'], string> = {
  applied: 'text-status-good',
  'already-enabled': 'text-status-good',
  'skipped-incompatible': 'text-white/40',
  'needs-manual-review': 'text-status-warning',
  failed: 'text-status-critical'
}

export default function ResultsReport({ results }: ResultsReportProps): React.JSX.Element {
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="ft-glass-solid p-4">
      <ul className="flex flex-col gap-1 text-sm">
        {Object.entries(counts).map(([outcome, count]) => (
          <li key={outcome} className={OUTCOME_CLASSES[outcome as TweakApplyResult['outcome']]}>
            {count} tweak{count === 1 ? '' : 's'} {OUTCOME_LABELS[outcome as TweakApplyResult['outcome']]}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3">
        {results.map((r) => (
          <div key={r.tweakId} className="text-xs">
            <span className="text-white/60">{getTweakById(r.tweakId)?.name ?? r.tweakId}:</span>{' '}
            <span className={OUTCOME_CLASSES[r.outcome]}>{OUTCOME_LABELS[r.outcome]}</span>
            {r.detail ? <span className="text-white/30"> — {r.detail}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
