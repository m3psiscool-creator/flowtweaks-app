import { runPowerShell } from '../../system/powershell'
import type { DnsAdapterInfo } from '../../../shared/ipc-types'

export interface DnsConfig {
  ipv4: { staticServers: string[] | null }
  ipv6: { enabled: boolean; staticServers: string[] | null }
}

interface RawDnsConfig {
  ipv4Static: string[] | string | null
  ipv6Enabled: boolean
  ipv6Static: string[] | string | null
}

function toArrayOrNull(value: string[] | string | null): string[] | null {
  if (value === null || value === undefined) return null
  // Windows PowerShell 5.1's ConvertTo-Json collapses 1-element arrays to scalars.
  return Array.isArray(value) ? value : [value]
}

/**
 * Reads the current DNS config for one adapter directly from the registry NameServer value —
 * empty/absent means DHCP/automatic, a populated value means static, and its exact contents are
 * what a later revert needs to restore. Same technique proven in the restore-point snapshot work.
 */
export async function readDnsConfig(adapter: DnsAdapterInfo): Promise<DnsConfig | null> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$adapter = Get-NetAdapter -InterfaceIndex ${adapter.interfaceIndex} -ErrorAction Stop
$ifGuid = $adapter.InterfaceGuid

$v4ns = try { (Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\$ifGuid" -Name NameServer -ErrorAction Stop).NameServer } catch { $null }
$v4Static = if ([string]::IsNullOrWhiteSpace($v4ns)) { $null } else { @($v4ns -split ',') }

$v6Binding = Get-NetAdapterBinding -InterfaceIndex ${adapter.interfaceIndex} -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue
$v6Enabled = if ($v6Binding) { [bool]$v6Binding.Enabled } else { $false }

$v6Static = $null
if ($v6Enabled) {
  $v6ns = try { (Get-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip6\\Parameters\\Interfaces\\$ifGuid" -Name NameServer -ErrorAction Stop).NameServer } catch { $null }
  if (-not [string]::IsNullOrWhiteSpace($v6ns)) { $v6Static = @($v6ns -split ',') }
}

@{ ipv4Static = $v4Static; ipv6Enabled = $v6Enabled; ipv6Static = $v6Static } | ConvertTo-Json -Compress -Depth 4
exit 0
`
  try {
    const stdout = await runPowerShell(script)
    if (!stdout) return null
    const raw = JSON.parse(stdout) as RawDnsConfig
    return {
      ipv4: { staticServers: toArrayOrNull(raw.ipv4Static) },
      ipv6: { enabled: raw.ipv6Enabled, staticServers: toArrayOrNull(raw.ipv6Static) }
    }
  } catch {
    return null
  }
}
