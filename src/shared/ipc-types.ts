// Contract between the main process (which reads real hardware/OS data) and
// the renderer (which displays it). Kept separate from data/schema.ts, which
// is strictly for tweak definitions.

import type { Operation } from '../../data/schema'

export interface DiskInfo {
  mount: string
  totalBytes: number
  usedBytes: number
}

export type GpuVendor = 'nvidia' | 'amd' | 'intel'

/** One-time system specs — gathered once when Home loads, not polled. */
export interface SystemSpecs {
  computerName: string
  windowsVersion: string
  windowsBuild: string
  cpuModel: string
  cpuCores: number
  cpuThreads: number
  gpuModel: string
  gpuVendors: GpuVendor[]
  ramTotalBytes: number
  disks: DiskInfo[]
}

/** Live figures — pushed from main on an interval while Home is open. */
export interface SystemUsage {
  cpuLoadPercent: number
  ramUsedBytes: number
  ramTotalBytes: number
}

/** Overall state Scan detected for one tweak on this PC. */
export type TweakCurrentState = 'already-enabled' | 'not-enabled' | 'partial' | 'unknown'

export interface TweakScanResult {
  tweakId: string
  compatible: boolean
  incompatibilityReason?: string
  currentState: TweakCurrentState
  /** True if this tweak needs admin rights and the app isn't currently elevated. */
  needsElevation: boolean
}

export interface ScanReport {
  isElevated: boolean
  results: TweakScanResult[]
}

// --- Restore & change log ---
// Everything below exists to make Phase 6 (applying tweaks) safe: every
// value here is captured BEFORE a change is made, so revert can put it back
// exactly as it was — not a guessed default.

export interface RegistrySnapshotValue {
  kind: 'registry'
  /**
   * False means the registry KEY itself didn't exist before (revert should delete the whole key,
   * not leave an empty one behind). Missing/undefined on entries logged before this field existed
   * — treat as true (the safe assumption: only ever delete the value, never the key) for those.
   */
  keyExisted?: boolean
  /** False means the value didn't exist before — revert should delete it, not write a default. */
  present: boolean
  raw: string | number | null
}

export interface ServiceSnapshotValue {
  kind: 'service'
  startMode: string
  wasRunning: boolean
}

export interface PowerPlanSnapshotValue {
  kind: 'powerPlan'
  activeGuid: string
  activeName: string
}

export interface NetworkDnsSnapshotValue {
  kind: 'networkDns'
  interfaces: Array<{ interfaceIndex: number; interfaceAlias: string; staticServers: string[] | null }>
}

export type SnapshotValue =
  | RegistrySnapshotValue
  | ServiceSnapshotValue
  | PowerPlanSnapshotValue
  | NetworkDnsSnapshotValue

/**
 * 'pending' is written to disk BEFORE the system change is attempted — durable proof that "this
 * operation was about to happen, here's its previous value" survives even if the app is killed
 * before the write completes or before the outcome gets updated. Reconciliation on next startup
 * resolves any 'pending' entries left over from a crash to their true outcome.
 */
export type ChangeOutcome = 'pending' | 'applied' | 'failed' | 'reverted' | 'revert-failed'

export interface ChangeLogEntry {
  id: string
  tweakId: string
  operationIndex: number
  operation: Operation
  previousValue: SnapshotValue
  outcome: ChangeOutcome
  errorMessage?: string
  timestamp: string
}

export interface RestoreSession {
  id: string
  createdAt: string
  description: string
  restorePointCreated: boolean
  entries: ChangeLogEntry[]
}

export interface RestorePointInfo {
  sequenceNumber: number
  description: string
  creationTime: string
}

export interface CreateRestorePointResult {
  success: boolean
  error?: string
}

export interface RevertResult {
  success: boolean
  error?: string
}

// --- Applying tweaks ---

export type TweakApplyOutcome =
  | 'applied'
  | 'already-enabled'
  | 'skipped-incompatible'
  | 'failed'
  | 'needs-manual-review'

export interface TweakApplyResult {
  tweakId: string
  outcome: TweakApplyOutcome
  detail?: string
}

export interface ApplySessionResult {
  sessionId: string | null
  restorePointCreated: boolean
  restorePointError?: string
  results: TweakApplyResult[]
}
