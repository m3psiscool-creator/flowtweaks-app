// Shape that every tweak definition must follow. This file has no logic in
// it — just types — so it's safe for both the main process (which executes
// operations) and the renderer (which displays them) to import.
//
// See Phase 1 design discussion for the reasoning behind the shape.

export type Category =
  | 'fps-latency'
  | 'windows-performance'
  | 'network'
  | 'gpu'
  | 'background-processes'
  | 'startup-programs'
  | 'storage-cleanup'
  | 'game-specific'
  | 'personalization'

export const CATEGORY_LABELS: Record<Category, string> = {
  'fps-latency': 'FPS & Latency',
  'windows-performance': 'Windows Performance',
  network: 'Network',
  gpu: 'GPU',
  'background-processes': 'Background Processes',
  'startup-programs': 'Startup Programs',
  'storage-cleanup': 'Storage Cleanup',
  'game-specific': 'Game-Specific',
  personalization: 'Personalization'
}

export type RiskLevel = 'low' | 'medium' | 'high'

export interface CompatibilityRule {
  /** Minimum Windows build number this tweak is safe to offer on. */
  minWindowsBuild?: number
  /** Restrict to specific GPU vendors, e.g. HAGS only makes sense with a dGPU. */
  gpuVendor?: ('nvidia' | 'amd' | 'intel')[]
  /** IDs of other tweaks that conflict with this one and must not both be applied. */
  excludes?: string[]
}

/**
 * One low-level system change. A tweak can bundle several of these — e.g.
 * "Visual Effects" writes eight separate registry values in one tweak.
 *
 * registry/service/powerPlan are snapshot-and-revert: the Restore engine
 * reads the current value right before writing, so revert always restores
 * whatever was actually there — not a guessed default.
 *
 * fileCleanup and externalTool have no meaningful "previous value" to
 * snapshot — tweaks built from these must set reversible: false at the
 * TweakDefinition level and rely on the Windows restore point instead.
 */
export type Operation =
  | {
      type: 'registry'
      hive: 'HKCU' | 'HKLM'
      path: string
      valueName: string
      valueType: 'REG_DWORD' | 'REG_SZ' | 'REG_BINARY'
      desiredValue: string | number
    }
  | {
      type: 'service'
      serviceName: string
      desiredStartType: 'disabled' | 'manual' | 'automatic'
      stopIfRunning: boolean
    }
  | {
      type: 'powerPlan'
      sourceGuid: string
      planName: string
    }
  | {
      type: 'networkDns'
      ipv4: [primary: string, secondary: string]
      ipv6?: [primary: string, secondary: string]
    }
  | {
      type: 'fileCleanup'
      targetPaths: string[]
    }
  | {
      type: 'externalTool'
      command: string
      args: string[]
      /** True if the tool opens its own UI/output the app can't parse (e.g. cleanmgr, sfc). */
      interactive: boolean
    }

export interface TweakDefinition {
  /** Stable unique key. Never reused or renamed once shipped — history and logs reference it forever. */
  id: string
  /** Customer-facing title. */
  name: string
  category: Category
  /** Plain-language description of what changes. Always shown to the customer. */
  whatItChanges: string
  /** Plain-language rationale. Never state a specific FPS number or guarantee. */
  whyItMayHelp: string
  riskLevel: RiskLevel
  requiresAdmin: boolean
  requiresRestart: boolean
  /**
   * Whether this tweak can be individually rolled back via a value snapshot.
   * False for fileCleanup/externalTool-based tweaks — those rely on the
   * Windows restore point only, and the UI must say so.
   */
  reversible: boolean
  compatibility: CompatibilityRule
  /** Read-only checks Scan uses to show current state and compatibility. Must not modify anything. */
  detect: Operation[]
  /** Operations run when the customer applies this tweak. */
  apply: Operation[]
  /** IDs of game profiles this tweak belongs to, e.g. ["fortnite-competitive"]. */
  gameProfiles?: string[]
}
