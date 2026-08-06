import { CATEGORY_COLORS, type TweakDefinition } from '@data/schema'
import type { TweakScanResult } from '@shared/ipc-types'
import Pill from './Pill'
import ToggleSwitch, { type ToggleVisualState } from './ToggleSwitch'
import { RISK_CLASSES, RISK_LABELS, STATE_CLASSES, STATE_LABELS } from '@renderer/lib/tweakDisplay'

interface TweakScanCardProps {
  tweak: TweakDefinition
  result?: TweakScanResult
  /**
   * Present when the app can actually flip this tweak on/off. Cards without this fall back to a
   * read-only state pill — either the app can't write this operation type yet, or (locked) the
   * customer hasn't unlocked the package.
   */
  toggle?: {
    onEnable: () => void
    onDisable: () => void
    /** True while THIS tweak's apply/disable call is in flight — shows "..." on its own switch. */
    busy: boolean
    /** True while a DIFFERENT tweak's action is running — greys this switch out without the "..." text. */
    disabled?: boolean
    /** False for tweaks the app can enable but not yet turn off (e.g. dns-cloudflare). */
    canDisable: boolean
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
}

export default function TweakScanCard({
  tweak,
  result,
  toggle,
  locked,
  freeUnlock,
  override
}: TweakScanCardProps): React.JSX.Element {
  const compatible = result?.compatible ?? true
  const blockedReason = !compatible
    ? 'incompatible with this PC'
    : result?.needsElevation
      ? 'needs administrator rights'
      : undefined
  const categoryColor = CATEGORY_COLORS[tweak.category]

  const visualState: ToggleVisualState =
    result?.currentState === 'already-enabled'
      ? 'on'
      : result?.currentState === 'partial'
        ? 'partial'
        : result?.currentState === 'unknown'
          ? 'unknown'
          : 'off'

  return (
    <div
      style={{ borderLeft: `3px solid ${visualState === 'on' ? '#0ca30c' : categoryColor}` }}
      className={`ft-glass ft-hoverable-subtle p-4 ${compatible ? '' : 'opacity-50'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-white">{tweak.name}</h3>
        </div>
        {toggle && !locked ? (
          <ToggleSwitch
            state={visualState}
            busy={toggle.busy}
            disabled={!!blockedReason || toggle.disabled || (visualState === 'on' && !toggle.canDisable)}
            ariaLabel={`Turn ${tweak.name} ${visualState === 'on' ? 'off' : 'on'}`}
            onClick={() => (visualState === 'on' ? toggle.onDisable() : toggle.onEnable())}
          />
        ) : (
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
        {toggle && visualState === 'on' && !toggle.canDisable && (
          <Pill label="Can't disable yet" className="bg-white/10 text-white/40" />
        )}
      </div>

      <p className="mt-2 text-sm text-white/60">{tweak.whatItChanges}</p>
      <p className="mt-1 text-sm text-white/40">{tweak.whyItMayHelp}</p>

      {!compatible && result?.incompatibilityReason && !override?.confirmed && (
        <p className="mt-2 text-sm text-status-critical">{result.incompatibilityReason}</p>
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

      {locked && (
        <button
          type="button"
          onClick={locked.onUnlockClick}
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
