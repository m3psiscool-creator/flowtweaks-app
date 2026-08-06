import type { TweakDefinition } from '../../../../data/schema'
import type { TweakScanResult } from '../../../shared/ipc-types'
import { checkDnsCompatibility } from './dnsCompatibility'

/**
 * DNS's "is this already enabled" question can't be answered by the generic per-operation value
 * comparison Scan uses for everything else — it depends on which adapter is currently primary and
 * whether its DNS is already exactly Cloudflare, DHCP, or something custom. Reuses the exact same
 * compatibility check apply uses, so Scan and Apply can never disagree about what's going on.
 */
/** needsElevation is left for the caller to fill in once isElevated is known, so this can run concurrently with the main scan script rather than waiting on it. */
export async function evaluateDnsScanState(tweak: TweakDefinition): Promise<Omit<TweakScanResult, 'needsElevation'>> {
  const op = tweak.apply.find((o) => o.type === 'networkDns')
  if (!op || op.type !== 'networkDns') {
    return {
      tweakId: tweak.id,
      compatible: false,
      incompatibilityReason: 'No networkDns operation defined for this tweak.',
      currentState: 'unknown'
    }
  }

  const compat = await checkDnsCompatibility(op.ipv4, op.ipv6, false)

  return {
    tweakId: tweak.id,
    compatible: compat.compatible,
    incompatibilityReason: compat.reason,
    currentState: !compat.adapter ? 'unknown' : compat.alreadyEnabled ? 'already-enabled' : 'not-enabled',
    overrideAvailable: compat.overrideAvailable
  }
}
