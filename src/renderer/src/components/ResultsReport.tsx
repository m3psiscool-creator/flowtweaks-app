import type { TweakApplyResult, TweakDisableResult } from '@shared/ipc-types'
import { getTweakById } from '@data/tweaks'

type AnyResult = TweakApplyResult | TweakDisableResult
type AnyOutcome = AnyResult['outcome']

interface ResultsReportProps {
  results: AnyResult[]
}

// Covers both apply and disable outcome sets — the same panel reports either direction, since a
// customer flipping one tweak's toggle sees the same summary shape as Run All.
const OUTCOME_LABELS: Record<AnyOutcome, string> = {
  applied: 'applied successfully',
  'already-enabled': 'already enabled',
  disabled: 'turned off',
  'already-disabled': 'already off',
  'skipped-incompatible': 'skipped — not compatible',
  failed: 'failed',
  'needs-manual-review': 'needs manual review'
}

// Same validated status palette as risk/state pills — successful outcomes read as good, failures
// as critical, review/skip states sit between, all at a glance instead of every line being white.
const OUTCOME_CLASSES: Record<AnyOutcome, string> = {
  applied: 'text-status-good',
  'already-enabled': 'text-status-good',
  disabled: 'text-status-good',
  'already-disabled': 'text-status-good',
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
          <li key={outcome} className={OUTCOME_CLASSES[outcome as AnyOutcome]}>
            {count} tweak{count === 1 ? '' : 's'} {OUTCOME_LABELS[outcome as AnyOutcome]}
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
