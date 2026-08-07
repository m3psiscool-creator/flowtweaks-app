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
  /** Number of GPU controllers Windows reports — used to gate multi-GPU-only tweaks like ULPS. */
  gpuCount: number
  /** 'unknown' when the chassis type can't be confidently read — treated as "not desktop" by compatibility checks. */
  chassisType: 'desktop' | 'portable' | 'unknown'
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
  /**
   * True only when this tweak is incompatible *specifically* because the customer already has
   * custom static DNS configured (not DHCP, not already Cloudflare) — the one incompatibility
   * reason that has a deliberate, opt-in override path in the UI instead of just being a dead end.
   */
  overrideAvailable?: boolean
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
  interfaceIndex: number
  interfaceAlias: string
  /** null means DHCP/automatic (no static override) for that family. */
  ipv4: { staticServers: string[] | null }
  /** enabled false means IPv6 isn't bound on this adapter at all — never touched, never reported. */
  ipv6: { enabled: boolean; staticServers: string[] | null }
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

/** Only ever set true by the explicit override-confirm modal — never by a bulk/profile apply. */
export interface ApplyOptions {
  allowDnsOverride?: boolean
}

// --- Disabling tweaks (the reverse direction — see disabledValue/disabledStartType on Operation
// in data/schema.ts for why this can't just be "revert", since a tweak Scan found already enabled
// may never have been applied by Flow Tweaks and so has no change-log entry to revert from) ---

export type TweakDisableOutcome =
  | 'disabled'
  | 'already-disabled'
  | 'skipped-incompatible'
  | 'failed'
  | 'needs-manual-review'

export interface TweakDisableResult {
  tweakId: string
  outcome: TweakDisableOutcome
  detail?: string
}

export interface DisableSessionResult {
  sessionId: string | null
  restorePointCreated: boolean
  restorePointError?: string
  results: TweakDisableResult[]
}

// --- DNS-specific (network tweaks are handled separately from the generic
// registry pipeline — see the plan discussion for why adapter topology and
// connectivity verification don't fit the declarative-rule model) ---

export interface DnsAdapterInfo {
  interfaceIndex: number
  interfaceAlias: string
  interfaceDescription: string
  isVirtual: boolean
}

/** Current DNS servers on the primary adapter — shown to the customer before they decide to override. */
export interface DnsOverrideInfo {
  interfaceAlias: string
  ipv4Servers: string[] | null
  ipv6Servers: string[] | null
}

// --- Wheel spin (one-time free unlock, no account needed) ---

export interface WheelState {
  spun: boolean
  /** Which tweak the spin unlocked — null until spun. Always the same tweak once spun. */
  unlockedTweakId: string | null
  spunAt: string | null
}

// --- Diagnostics ---

/** A full, self-contained snapshot for support — everything staff would need without guessing. */
export interface DiagnosticReport {
  generatedAt: string
  specs: SystemSpecs
  scan: ScanReport
  sessions: RestoreSession[]
  wheel: WheelState
}

export interface SupportCodeResult {
  code: string
  filePath: string
}

export interface ExportReportResult {
  filePath: string | null
}

// sfc-scan moved here from the tweak catalog — it's a repair/diagnostic action, not a
// performance optimization (nothing to detect/apply/revert, no "risk level" that means anything).
export type SfcScanOutcome = 'clean' | 'repaired' | 'partial' | 'error'

export interface SfcScanResult {
  outcome: SfcScanOutcome
  /** Trimmed final sfc.exe output — shown to the customer for support-code purposes. */
  rawOutput: string
}

// --- Startup Programs (dynamic, per-machine — not part of the static tweak catalog) ---

export type StartupSource = 'registry' | 'startupFolder'
export type StartupScope = 'user' | 'allUsers'

export interface StartupItem {
  /** Stable within one PC: `${scope}:${source}:${name}` — name is the Run value name or shortcut filename. */
  id: string
  name: string
  /** The command/target path this item launches — shown so a customer can recognize what it is. */
  command: string
  source: StartupSource
  scope: StartupScope
  /**
   * Read from the same StartupApproved registry flag Task Manager's own Startup tab uses — no
   * StartupApproved entry at all means Windows' default (enabled), not disabled.
   */
  enabled: boolean
  /** True when this item's scope is allUsers (HKLM) and the app isn't currently elevated. */
  needsElevation: boolean
}

export interface StartupReport {
  isElevated: boolean
  items: StartupItem[]
}

export interface StartupToggleResult {
  success: boolean
  error?: string
  restorePointCreated: boolean
  restorePointError?: string
}

// --- Account (authenticates against the existing Render backend — no second backend) ---

export interface AccountUser {
  id: string
  email?: string
  name?: string | null
  username?: string
  role: 'customer' | 'staff'
}

export interface AccountSession {
  token: string
  user: AccountUser
}

export type TicketPlan = 'pc' | 'console' | 'both'
export type TicketStatus = 'open' | 'claimed' | 'in_progress' | 'completed'

export interface AccountTicket {
  id: string
  plan: TicketPlan
  planLabel: string
  price: number
  status: TicketStatus
  createdAt: string
}

export interface RequestCodeResult {
  ok: boolean
  message: string
}

/** Only 'pc' and 'both' can be bought in-app — console has no Windows app to unlock, stays a website+Discord purchase. */
export type AppPurchasablePlan = 'pc' | 'both'

export interface CheckoutResult {
  ok: boolean
  error?: string
}

export interface RedeemCodeResult {
  ok: boolean
  ticket?: AccountTicket
  error?: string
}
