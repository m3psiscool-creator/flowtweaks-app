import { CATEGORY_COLORS, type TweakDefinition } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import Pill from './Pill'
import { RISK_CLASSES, RISK_LABELS, STATE_CLASSES, STATE_LABELS } from '@renderer/lib/tweakDisplay'

interface TweakScanCardProps {
  tweak: TweakDefinition
  result?: TweakScanResult
  /**
   * Present when this tweak can be picked for a batch apply right now (compatible, apply-enabled,
   * not already fully enabled, elevation not blocking it). Clicking anywhere on the card toggles
   * selection — there's no more per-card auto-apply switch, selection just marks intent; nothing
   * on this PC changes until "Apply Selected"/"Apply All" runs.
   */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  /**
   * Present for already-enabled, disable-capable tweaks — the one remaining single-tweak action,
   * kept separate from selection since "turn this back off" is a different intent than "apply
   * this." Rendered as a small link, never a switch.
   */
  disableAction?: {
    onDisable: () => void
    busy: boolean
    disabled?: boolean
  }
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
  /** GPU-hardware-aware guidance (currently only HAGS) — informational, never gates selection. */
  recommendation?: {
    level: 'recommended' | 'not-recommended'
    reason: string
  }
}

export default function TweakScanCard({
  tweak,
  result,
  selectable,
  selected,
  onToggleSelect,
  disableAction,
  locked,
  freeUnlock,
  override,
  recommendation
}: TweakScanCardProps): React.JSX.Element {
  const compatible = result?.compatible ?? true
  const categoryColor = CATEGORY_COLORS[tweak.category]
  const alreadyEnabled = result?.currentState === 'already-enabled'
  const clickable = !!selectable && !!onToggleSelect

  function handleCardClick(): void {
    if (clickable) onToggleSelect?.()
  }

  function handleCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (!clickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleSelect?.()
    }
  }

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-pressed={clickable ? !!selected : undefined}
      style={{ borderLeft: `3px solid ${alreadyEnabled ? '#0ca30c' : categoryColor}` }}
      className={`ft-glass ft-hoverable-subtle p-4 transition-colors ${compatible ? '' : 'opacity-50'} ${
        clickable ? 'cursor-pointer' : ''
      } ${selected ? 'ring-2 ring-ft-orange bg-ft-orange/5' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-white">{tweak.name}</h3>
        </div>
        {clickable ? (
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
              selected
                ? 'border-ft-orange bg-ft-orange text-ft-black'
                : 'border-white/25 bg-transparent text-transparent'
            }`}
          >
            ✓
          </span>
        ) : disableAction ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              disableAction.onDisable()
            }}
            disabled={disableAction.disabled}
            className="text-xs text-white/40 underline hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {disableAction.busy ? 'Turning off…' : 'Turn off'}
          </button>
        ) : (
          !locked &&
          result && <Pill label={STATE_LABELS[result.currentState]} className={STATE_CLASSES[result.currentState]} />
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Pill label={RISK_LABELS[tweak.riskLevel]} className={RISK_CLASSES[tweak.riskLevel]} />
        {result?.needsElevation && <Pill label="Needs Admin" className="bg-status-warning/15 text-status-warning" />}
        {!compatible && !override?.confirmed && (
          <Pill label="Incompatible" className="bg-status-critical/15 text-status-critical" />
        )}
        {override?.confirmed && <Pill label="Override confirmed" className="bg-status-warning/15 text-status-warning" />}
        {locked && <Pill label="Locked" className="bg-white/10 text-white/50" />}
        {freeUnlock && <Pill label="Free Unlock" className="bg-ft-orange/15 text-ft-orange" />}
        {alreadyEnabled && !disableAction && (
          <Pill label="Can't disable yet" className="bg-white/10 text-white/40" />
        )}
        {recommendation && (
          <Pill
            label={recommendation.level === 'recommended' ? 'Recommended For Your PC' : 'Not Recommended For Your PC'}
            className={
              recommendation.level === 'recommended'
                ? 'bg-status-good/15 text-status-good'
                : 'bg-status-warning/15 text-status-warning'
            }
          />
        )}
      </div>

      <p className="mt-2 text-sm text-white/60">{tweak.whatItChanges}</p>
      <p className="mt-1 text-sm text-white/40">{tweak.whyItMayHelp}</p>
      {recommendation && <p className="mt-1 text-sm text-white/40">{recommendation.reason}</p>}

      {!compatible && result?.incompatibilityReason && !override?.confirmed && (
        <p className="mt-2 text-sm text-status-critical">{result.incompatibilityReason}</p>
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
      </div>
    </div>
  )
}
