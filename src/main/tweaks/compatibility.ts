import type { CompatibilityRule } from '../../../data/schema'
import type { SystemSpecs } from '../../shared/ipc-types'

export interface CompatibilityResult {
  compatible: boolean
  reason?: string
}

export function evaluateCompatibility(
  rule: CompatibilityRule,
  specs: SystemSpecs,
  enabledTweakIds: Set<string>
): CompatibilityResult {
  if (rule.minWindowsBuild) {
    const build = parseInt(specs.windowsBuild, 10)
    if (!Number.isNaN(build) && build < rule.minWindowsBuild) {
      return {
        compatible: false,
        reason: `Requires Windows build ${rule.minWindowsBuild} or newer (this PC is on ${build}).`
      }
    }
  }

  if (rule.gpuVendor && rule.gpuVendor.length > 0) {
    const hasMatch = rule.gpuVendor.some((vendor) => specs.gpuVendors.includes(vendor))
    if (!hasMatch) {
      return { compatible: false, reason: `Requires a ${rule.gpuVendor.join(' or ')} GPU.` }
    }
  }

  if (rule.desktopOnly && specs.chassisType !== 'desktop') {
    return {
      compatible: false,
      reason: 'Only offered on desktop PCs — this looks like a laptop or portable device that may run off battery.'
    }
  }

  if (rule.excludes && rule.excludes.length > 0) {
    const conflict = rule.excludes.find((id) => enabledTweakIds.has(id))
    if (conflict) {
      return { compatible: false, reason: `Conflicts with "${conflict}", which is already applied.` }
    }
  }

  return { compatible: true }
}
