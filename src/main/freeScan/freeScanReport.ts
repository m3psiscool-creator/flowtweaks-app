import { getSystemSpecs } from '../system/systemInfo'
import { runScan } from '../tweaks/scan'
import { getStartupReport } from '../startup'
import { getPrimaryDnsAdapter } from '../tweaks/dns/primaryAdapter'
import { readDnsConfig } from '../tweaks/dns/readDnsConfig'
import { getFreeScanHardwareExtras } from './hardwareExtras'
import { getBackgroundProcessesSnapshot } from './backgroundProcesses'
import { getTempCacheSize } from './tempCacheSize'
import { getInstalledGames } from './installedGames'
import type { DnsOverrideInfo, FreeScanReport } from '../../shared/ipc-types'

/**
 * Best-effort, read-only current DNS summary for display — deliberately reuses the same
 * adapter-resolution path the DNS tweak's own scan/apply uses (src/main/tweaks/dns/) rather than a
 * second implementation, so "what DNS are you on" always agrees with what the DNS tweak card shows.
 * Returns null on anything that isn't cleanly resolvable (ambiguous/VPN adapter, no adapter found)
 * — the free scan just omits the network summary rather than guessing.
 */
async function getDnsSummary(): Promise<DnsOverrideInfo | null> {
  const eligibility = await getPrimaryDnsAdapter()
  if (!eligibility.eligible) return null
  const config = await readDnsConfig(eligibility.adapter)
  if (!config) return null
  return {
    interfaceAlias: eligibility.adapter.interfaceAlias,
    ipv4Servers: config.ipv4.staticServers,
    ipv6Servers: config.ipv6.staticServers
  }
}

/**
 * Phase 2 of CLAUDE-free-scan.md: the full read-only detection pass, combining the existing
 * tweak-scan/compatibility engine (scan.ts) with the free-scan-specific extras that engine never
 * needed to gather (background processes, startup items, temp/cache volume, installed games,
 * extra hardware facts, current DNS). Nothing here writes to the system — see each module's own
 * comments for why every individual read is safe unelevated.
 */
export async function buildFreeScanReport(): Promise<FreeScanReport> {
  const specs = await getSystemSpecs()

  const [scan, hardware, backgroundProcesses, startup, tempCache, installedGames, dnsSummary] =
    await Promise.all([
      runScan(specs),
      getFreeScanHardwareExtras(),
      getBackgroundProcessesSnapshot(),
      getStartupReport(),
      getTempCacheSize(),
      getInstalledGames(),
      getDnsSummary()
    ])

  return {
    generatedAt: new Date().toISOString(),
    specs,
    scan,
    extras: {
      hardware,
      backgroundProcesses,
      startupItems: startup.items,
      tempCache,
      installedGames,
      dnsSummary
    }
  }
}
