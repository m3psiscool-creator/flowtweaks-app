import type { TweakCurrentState } from '@shared/ipc-types'
import type { RiskLevel } from '@data/schema'

export const STATE_LABELS: Record<TweakCurrentState, string> = {
  'already-enabled': 'Already Enabled',
  'not-enabled': 'Not Enabled',
  partial: 'Partially Enabled',
  unknown: 'Unknown'
}

export const STATE_CLASSES: Record<TweakCurrentState, string> = {
  'already-enabled': 'bg-green-500/15 text-green-400',
  'not-enabled': 'bg-white/10 text-white/60',
  partial: 'bg-yellow-500/15 text-yellow-400',
  unknown: 'bg-white/5 text-white/40'
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk'
}

export const RISK_CLASSES: Record<RiskLevel, string> = {
  low: 'bg-white/10 text-white/60',
  medium: 'bg-yellow-500/15 text-yellow-400',
  high: 'bg-red-500/15 text-red-400'
}
