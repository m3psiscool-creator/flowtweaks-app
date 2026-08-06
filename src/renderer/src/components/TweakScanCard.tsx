import type { TweakDefinition } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import Pill from './Pill'
import { RISK_CLASSES, RISK_LABELS, STATE_CLASSES, STATE_LABELS } from '@renderer/lib/tweakDisplay'

interface TweakScanCardProps {
  tweak: TweakDefinition
  result?: TweakScanResult
  /** When provided, the whole card becomes clickable to select it for applying. */
  selection?: {
    selected: boolean
    onToggle: () => void
    disabledReason?: string
  }
  /** True when this specific tweak hasn't had its apply logic enabled yet. */
  applyUnavailable?: boolean
  /** Set when this tweak is part of the paid package and hasn't been unlocked (paid or won) yet. */
  locked?: {
    onUnlockClick: () => void
  }
  /** True when this tweak was unlocked for free via the wheel spin, not purchased. */
  freeUnlock?: boolean
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
  locked,
  freeUnlock,
  override
}: TweakScanCardProps): React.JSX.Element {
  const compatible = result?.compatible ?? true
  const alreadyEnabled = result?.currentState === 'already-enabled'
  const canSelect = !!selection && compatible && !result?.needsElevation && !alreadyEnabled
  const selected = !!selection?.selected

  return (
    <div
      role={canSelect ? 'button' : undefined}
      tabIndex={canSelect ? 0 : undefined}
      onClick={() => {
        if (canSelect) selection!.onToggle()
      }}
      onKeyDown={(e) => {
        if (canSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          selection!.onToggle()
        }
      }}
      className={`rounded-lg border p-4 transition-all duration-150 ${
        selected
          ? 'border-ft-orange bg-ft-orange/10 shadow-[0_0_20px_-6px_rgba(255,85,0,0.45)]'
          : `border-white/10 bg-white/5 ${canSelect ? 'ft-hoverable' : 'ft-hoverable-subtle'}`
      } ${compatible ? '' : 'opacity-50'} ${canSelect ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {selection && (
            <span
              aria-hidden="true"
              className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                selected ? 'border-ft-orange bg-ft-orange text-ft-black' : 'border-white/30'
              }`}
            >
              {selected && (
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
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
          {locked && <Pill label="Locked" className="bg-white/10 text-white/50" />}
          {freeUnlock && <Pill label="Free Unlock" className="bg-ft-orange/15 text-ft-orange" />}
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
          onClick={(e) => {
            e.stopPropagation()
            override.onStart()
          }}
          className="mt-2 text-sm text-ft-orange underline hover:opacity-80"
        >
          Override and use Cloudflare DNS anyway…
        </button>
      )}
      {override?.confirmed && (
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-white/60">This run will replace your custom DNS servers.</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              override.onCancel()
            }}
            className="text-white/40 underline hover:text-white/70"
          >
            Cancel
          </button>
        </div>
      )}

      {selection?.disabledReason && !canSelect && !alreadyEnabled && (
        <p className="mt-2 text-sm text-white/30">{selection.disabledReason}</p>
      )}

      {locked && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            locked.onUnlockClick()
          }}
          className="ft-heading ft-btn-glow mt-2 rounded bg-ft-orange px-3 py-1.5 text-xs tracking-wide text-ft-black transition-opacity hover:opacity-90"
        >
          Unlock Full Package — $11.99
        </button>
      )}

      <div className="mt-3 flex gap-4 text-xs text-white/30">
        {tweak.requiresRestart && <span>Requires restart</span>}
        {!tweak.reversible && <span>Not individually reversible</span>}
        {applyUnavailable && <span>Applying not available yet</span>}
      </div>
    </div>
  )
}
