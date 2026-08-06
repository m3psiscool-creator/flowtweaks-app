import type { TweakDefinition } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import Pill from './Pill'
import { RISK_CLASSES, RISK_LABELS, STATE_CLASSES, STATE_LABELS } from '@renderer/lib/tweakDisplay'

interface TweakScanCardProps {
  tweak: TweakDefinition
  result?: TweakScanResult
  /** When provided, renders a checkbox and lets the card be selected for applying. */
  selection?: {
    selected: boolean
    onToggle: () => void
    disabledReason?: string
  }
  /** True when this specific tweak hasn't had its apply logic enabled yet. */
  applyUnavailable?: boolean
  /** DNS-specific: only set when the sole incompatibility is "custom DNS already configured." */
  override?: {
    confirmed: boolean
    onStart: () => void
    onCancel: () => void
  }
}

export default function TweakScanCard({
  tweak,
  result,
  selection,
  applyUnavailable,
  override
}: TweakScanCardProps): React.JSX.Element {
  const compatible = result?.compatible ?? true
  const alreadyEnabled = result?.currentState === 'already-enabled'
  const canSelect = !!selection && compatible && !result?.needsElevation && !alreadyEnabled

  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/5 p-4 ${compatible ? '' : 'opacity-50'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {selection && (
            <input
              type="checkbox"
              checked={selection.selected}
              onChange={selection.onToggle}
              disabled={!canSelect}
              className="mt-1 accent-ft-orange"
            />
          )}
          <h3 className="font-semibold text-white">{tweak.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result && (
            <Pill label={STATE_LABELS[result.currentState]} className={STATE_CLASSES[result.currentState]} />
          )}
          <Pill label={RISK_LABELS[tweak.riskLevel]} className={RISK_CLASSES[tweak.riskLevel]} />
          {result?.needsElevation && (
            <Pill label="Needs Admin" className="bg-orange-500/15 text-ft-orange" />
          )}
          {!compatible && !override?.confirmed && (
            <Pill label="Incompatible" className="bg-red-500/15 text-red-400" />
          )}
          {override?.confirmed && (
            <Pill label="Override confirmed" className="bg-ft-orange/15 text-ft-orange" />
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-white/60">{tweak.whatItChanges}</p>
      <p className="mt-1 text-sm text-white/40">{tweak.whyItMayHelp}</p>

      {!compatible && result?.incompatibilityReason && !override?.confirmed && (
        <p className="mt-2 text-sm text-red-400">{result.incompatibilityReason}</p>
      )}

      {override && !override.confirmed && (
        <button
          type="button"
          onClick={override.onStart}
          className="mt-2 text-sm text-ft-orange underline hover:opacity-80"
        >
          Override and use Cloudflare DNS anyway…
        </button>
      )}
      {override?.confirmed && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-white/60">This run will replace your custom DNS servers.</span>
          <button type="button" onClick={override.onCancel} className="text-white/40 underline hover:text-white/70">
            Cancel
          </button>
        </div>
      )}

      {selection?.disabledReason && !canSelect && !alreadyEnabled && (
        <p className="mt-2 text-sm text-white/30">{selection.disabledReason}</p>
      )}

      <div className="mt-3 flex gap-4 text-xs text-white/30">
        {tweak.requiresRestart && <span>Requires restart</span>}
        {!tweak.reversible && <span>Not individually reversible</span>}
        {applyUnavailable && <span>Applying not available yet</span>}
      </div>
    </div>
  )
}
