export type ToggleVisualState = 'on' | 'off' | 'partial' | 'unknown'

interface ToggleSwitchProps {
  state: ToggleVisualState
  busy?: boolean
  disabled?: boolean
  onClick: () => void
  ariaLabel: string
}

const TRACK_CLASSES: Record<ToggleVisualState, string> = {
  on: 'border-status-good/60 bg-status-good/25',
  partial: 'border-status-warning/60 bg-status-warning/20',
  off: 'border-white/20 bg-white/5',
  unknown: 'border-white/15 bg-white/5'
}

const THUMB_CLASSES: Record<ToggleVisualState, string> = {
  on: 'translate-x-[26px] bg-status-good',
  partial: 'translate-x-[15px] bg-status-warning',
  off: 'translate-x-[3px] bg-white/50',
  unknown: 'translate-x-[3px] bg-white/30'
}

const LABEL_TEXT: Record<ToggleVisualState, string> = {
  on: 'ON',
  partial: 'PARTIAL',
  off: 'OFF',
  unknown: 'UNKNOWN'
}

const LABEL_CLASSES: Record<ToggleVisualState, string> = {
  on: 'text-status-good',
  partial: 'text-status-warning',
  off: 'text-white/40',
  unknown: 'text-white/30'
}

/**
 * A real switch, not a color-only pill — the thing this replaced ("Already Enabled" in a small
 * green pill) was hard to spot at a glance across a page of 14+ cards. State is signaled twice
 * (switch position + text label), never by color alone.
 */
export default function ToggleSwitch({ state, busy, disabled, onClick, ariaLabel }: ToggleSwitchProps): React.JSX.Element {
  const inactive = disabled || busy
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={state === 'on'}
        aria-label={ariaLabel}
        disabled={inactive}
        onClick={onClick}
        className={`relative inline-flex h-6 w-12 shrink-0 items-center rounded-full border transition-colors ${TRACK_CLASSES[state]} ${
          inactive ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:opacity-90'
        }`}
      >
        <span className={`inline-block h-[18px] w-[18px] transform rounded-full shadow transition-transform ${THUMB_CLASSES[state]}`} />
      </button>
      <span className={`ft-heading text-[11px] tracking-wide ${LABEL_CLASSES[state]}`}>
        {busy ? '...' : LABEL_TEXT[state]}
      </span>
    </div>
  )
}
