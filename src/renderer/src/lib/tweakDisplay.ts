import type { TweakCurrentState } from '@shared/ipc-types'
import type { RiskLevel } from '@data/schema'

export const STATE_LABELS: Record<TweakCurrentState, string> = {
  'already-enabled': 'Already Enabled',
  'not-enabled': 'Not Enabled',
  partial: 'Partially Enabled',
  unknown: 'Unknown'
}

// Validated status palette (dataviz skill — CVD + contrast checked against this app's real
// #0d0d0d surface), not ad-hoc Tailwind colors. "not-enabled"/"unknown" stay neutral gray on
// purpose — they aren't a good or bad outcome, just "nothing to report."
export const STATE_CLASSES: Record<TweakCurrentState, string> = {
  'already-enabled': 'bg-status-good/15 text-status-good',
  'not-enabled': 'bg-white/10 text-white/60',
  partial: 'bg-status-warning/15 text-status-warning',
  unknown: 'bg-white/5 text-white/40'
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk'
}

export const RISK_CLASSES: Record<RiskLevel, string> = {
  low: 'bg-status-good/15 text-status-good',
  medium: 'bg-status-warning/15 text-status-warning',
  high: 'bg-status-critical/15 text-status-critical'
}
