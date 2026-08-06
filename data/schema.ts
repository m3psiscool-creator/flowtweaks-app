// Shape that every tweak definition must follow. This file has no logic in
// it — just types — so it's safe for both the main process (which executes
// operations) and the renderer (which displays them) to import.
//
// See Phase 1 design discussion for the reasoning behind the shape.

export type Category =
  | 'fps-latency'
  | 'input'
  | 'windows-performance'
  | 'network'
  | 'gpu'
  | 'background-processes'
  | 'startup-programs'
  | 'storage-cleanup'
  | 'game-specific'
  | 'personalization'
  | 'privacy-noise'

export const CATEGORY_LABELS: Record<Category, string> = {
  'fps-latency': 'FPS & Latency',
  input: 'Input',
  'windows-performance': 'Windows Performance',
  network: 'Network',
  gpu: 'GPU',
  'background-processes': 'Background Processes',
  'startup-programs': 'Startup Programs',
  'storage-cleanup': 'Storage Cleanup',
  'game-specific': 'Game-Specific',
  personalization: 'Personalization',
  'privacy-noise': 'Privacy & Noise'
}

/**
 * Fixed hue per category, drawn from a CVD-validated 8-hue categorical set (validated against
 * this app's actual #0d0d0d surface — see the dataviz skill's color-formula/palette references).
 * Brand orange (#FF5500) is deliberately NOT reused here — it's reserved for selection/CTA/brand
 * so a category tag never gets mistaken for "this card is selected." Categories always render
 * with a text label alongside the color, so a little reuse among the lower-traffic categories
 * (storage-cleanup/game-specific/personalization) is fine — color is never the only signal.
 */
export const CATEGORY_COLORS: Record<Category, string> = {
  'fps-latency': '#e66767', // red
  gpu: '#9085e9', // violet
  'windows-performance': '#3987e5', // blue
  network: '#199e70', // aqua
  input: '#d55181', // magenta
  'privacy-noise': '#c98500', // yellow/gold
  'background-processes': '#008300', // green
  'startup-programs': '#d95926', // categorical orange (distinct step from brand #FF5500)
  'storage-cleanup': '#3987e5', // blue (reuse — low-traffic category)
  'game-specific': '#9085e9', // violet (reuse)
  personalization: '#199e70' // aqua (reuse)
}

export type RiskLevel = 'low' | 'medium' | 'high'

/**
 * A rough, qualitative bucket used only by the FPS Predictor to weight its estimate — never shown
 * to the customer as a number, and never a guarantee. CLAUDE.md is explicit: never promise a
 * specific FPS figure, since actual results depend entirely on hardware and existing config.
 * 'none' covers tweaks that are real and worth doing but aren't performance-related at all
 * (Dark Mode, disk cleanup, DNS) — they must not silently count toward a gain estimate.
 */
export type FpsImpact = 'none' | 'low' | 'medium' | 'high'

export interface CompatibilityRule {
  /** Minimum Windows build number this tweak is safe to offer on. */
  minWindowsBuild?: number
  /** Restrict to specific GPU vendors, e.g. HAGS only makes sense with a dGPU. */
  gpuVendor?: ('nvidia' | 'amd' | 'intel')[]
  /**
   * Restrict to a real, unambiguous desktop chassis (see systemInfo.ts's classifyChassisType) —
   * used for tweaks like disabling hibernation that are unsafe to offer on anything that might run
   * off battery. 'unknown' chassis readings are treated as NOT desktop, never assumed safe.
   */
  desktopOnly?: boolean
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
 *
 * registry and service also carry an explicit "off" value (disabledValue /
 * disabledStartType), separate from the snapshot-based revert. Revert only
 * works if Flow Tweaks itself made the change — a tweak that was already
 * enabled on the customer's PC when Scan ran has no captured previous value
 * to revert to at all. The explicit off-value is what lets "Already Enabled"
 * tweaks be turned off directly, not just undone. It must be a real, defined
 * value, never guessed from desiredValue — some tweaks invert a Windows
 * default that's OFF, others invert one that's ON, so there's no safe generic
 * rule ("flip the DWORD") that works for both directions.
 */
export type Operation =
  | {
      type: 'registry'
      hive: 'HKCU' | 'HKLM'
      path: string
      valueName: string
      valueType: 'REG_DWORD' | 'REG_SZ' | 'REG_BINARY'
      desiredValue: string | number
      disabledValue: string | number
    }
  | {
      type: 'service'
      serviceName: string
      desiredStartType: 'disabled' | 'manual' | 'automatic'
      disabledStartType: 'disabled' | 'manual' | 'automatic'
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
  /** Qualitative weight for the FPS Predictor only — see FpsImpact for why this is never a number. */
  fpsImpact: FpsImpact
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
