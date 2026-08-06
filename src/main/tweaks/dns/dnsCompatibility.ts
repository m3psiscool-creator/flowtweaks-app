import type { DnsAdapterInfo, DnsOverrideInfo } from '../../../shared/ipc-types'
import { getPrimaryDnsAdapter } from './primaryAdapter'
import { readDnsConfig, type DnsConfig } from './readDnsConfig'

export interface DnsCompatibilityResult {
  compatible: boolean
  reason?: string
  /** True only for the specific "custom static DNS already present" incompatibility. */
  overrideAvailable: boolean
  alreadyEnabled: boolean
  adapter?: DnsAdapterInfo
  config?: DnsConfig
}

function serversMatch(current: string[] | null, desired: string[]): boolean {
  if (!current) return false
  const a = current.map((s) => s.toLowerCase()).sort()
  const b = desired.map((s) => s.toLowerCase()).sort()
  return a.length === b.length && a.every((v, i) => v === b[i])
}

/**
 * Dynamic, adapter-topology-aware compatibility check for the Cloudflare DNS tweak — this doesn't
 * fit the generic declarative CompatibilityRule model (minWindowsBuild/gpuVendor/excludes), since
 * it depends on live network state: which adapter is primary right now, and whether it already
 * has DNS servers someone deliberately configured (Pi-hole, NextDNS, corporate resolver, or just
 * a public resolver set years ago and forgotten). Any static config that isn't already Cloudflare
 * is treated as intentional — no attempt to guess which providers are "safe" to silently override.
 */
export async function checkDnsCompatibility(
  desiredIpv4: string[],
  desiredIpv6: string[] | undefined,
  allowOverride: boolean
): Promise<DnsCompatibilityResult> {
  const eligibility = await getPrimaryDnsAdapter()
  if (!eligibility.eligible) {
    return {
      compatible: false,
      reason: eligibility.reason,
      overrideAvailable: false,
      alreadyEnabled: false,
      adapter: eligibility.adapter
    }
  }

  const config = await readDnsConfig(eligibility.adapter)
  if (!config) {
    return {
      compatible: false,
      reason: `Could not read the current DNS configuration for "${eligibility.adapter.interfaceAlias}".`,
      overrideAvailable: false,
      alreadyEnabled: false,
      adapter: eligibility.adapter
    }
  }

  const v4Status = !config.ipv4.staticServers
    ? 'dhcp'
    : serversMatch(config.ipv4.staticServers, desiredIpv4)
      ? 'cloudflare'
      : 'custom'

  const v6Applicable = config.ipv6.enabled && !!desiredIpv6
  const v6Status = !v6Applicable
    ? 'n/a'
    : !config.ipv6.staticServers
      ? 'dhcp'
      : serversMatch(config.ipv6.staticServers, desiredIpv6!)
        ? 'cloudflare'
        : 'custom'

  const hasCustom = v4Status === 'custom' || v6Status === 'custom'
  const alreadyEnabled = v4Status === 'cloudflare' && (v6Status === 'cloudflare' || v6Status === 'n/a')

  if (hasCustom && !allowOverride) {
    const currentV4 = config.ipv4.staticServers?.join(', ') ?? 'automatic'
    const currentV6 = v6Applicable
      ? (config.ipv6.staticServers?.join(', ') ?? 'automatic')
      : 'not applicable (IPv6 not enabled on this adapter)'
    return {
      compatible: false,
      overrideAvailable: true,
      alreadyEnabled: false,
      adapter: eligibility.adapter,
      config,
      reason: `"${eligibility.adapter.interfaceAlias}" already has custom DNS servers configured (IPv4: ${currentV4}; IPv6: ${currentV6}) — not automatic/ISP-default. Flow Tweaks won't override custom DNS settings without explicit confirmation.`
    }
  }

  return { compatible: true, overrideAvailable: false, alreadyEnabled, adapter: eligibility.adapter, config }
}

/** Called when the customer clicks "Override" in the UI — fresh read, not cached from an earlier Scan. */
export async function getDnsOverrideInfo(
  desiredIpv4: string[],
  desiredIpv6: string[] | undefined
): Promise<DnsOverrideInfo | null> {
  const result = await checkDnsCompatibility(desiredIpv4, desiredIpv6, false)
  if (!result.overrideAvailable || !result.adapter || !result.config) return null
  return {
    interfaceAlias: result.adapter.interfaceAlias,
    ipv4Servers: result.config.ipv4.staticServers,
    ipv6Servers: result.config.ipv6.enabled ? result.config.ipv6.staticServers : null
  }
}
