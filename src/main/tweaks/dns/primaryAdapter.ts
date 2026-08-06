import { runPowerShell } from '../../system/powershell'
import type { DnsAdapterInfo } from '../../../shared/ipc-types'

export type DnsEligibility =
  | { eligible: true; adapter: DnsAdapterInfo }
  | { eligible: false; reason: string; adapter?: DnsAdapterInfo }

interface RawResult {
  found: boolean
  ambiguous?: boolean
  ifIndex?: number
  name?: string
  description?: string
  virtual?: boolean
  looksLikeHyperV?: boolean
  bridgedPhysicalAdapter?: string | null
}

/**
 * One PowerShell process: finds the adapter Windows actually routes general internet traffic
 * through (lowest effective default-route metric), then — only if that adapter is virtual —
 * determines whether it's a Hyper-V External-switch bridge (safe to treat as primary; common on
 * WSL2/Docker Desktop machines) or something else, most likely a VPN tunnel (skip).
 *
 * The Hyper-V check is structural, not name-based: binding an External switch to a physical NIC
 * makes Windows disable that NIC's own ms_tcpip binding, since the vEthernet takes over IP duties.
 * A VPN tunnel never touches any physical adapter's bindings — it's an independent virtual NIC
 * with its own unrelated gateway. So "some physical adapter has ms_tcpip disabled" is a reliable,
 * implementation-level signal a name-matching heuristic against ever-changing VPN products isn't.
 */
export async function getPrimaryDnsAdapter(): Promise<DnsEligibility> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$result = @{}

$routes = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue
if (-not $routes) {
  $result['found'] = $false
} else {
  $scored = $routes | ForEach-Object {
    $ifm = (Get-NetIPInterface -InterfaceIndex $_.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).InterfaceMetric
    if ($null -eq $ifm) { $ifm = 0 }
    [PSCustomObject]@{ IfIndex = $_.ifIndex; Effective = [int]$_.RouteMetric + [int]$ifm }
  } | Sort-Object Effective

  $lowest = $scored[0].Effective
  $tiedIfIndexes = @($scored | Where-Object { $_.Effective -eq $lowest } | Select-Object -ExpandProperty IfIndex -Unique)

  if ($tiedIfIndexes.Count -gt 1) {
    $result['found'] = $true
    $result['ambiguous'] = $true
  } else {
    $adapter = Get-NetAdapter -InterfaceIndex $scored[0].IfIndex -ErrorAction Stop
    $result['found'] = $true
    $result['ambiguous'] = $false
    $result['ifIndex'] = [int]$adapter.ifIndex
    $result['name'] = $adapter.Name
    $result['description'] = $adapter.InterfaceDescription
    $result['virtual'] = [bool]$adapter.Virtual

    if ($adapter.Virtual) {
      $isHyperV = $adapter.InterfaceDescription -match 'Hyper-V Virtual Ethernet Adapter'
      $result['looksLikeHyperV'] = $isHyperV
      $bridgedPhysical = $null
      if ($isHyperV) {
        $physicals = Get-NetAdapter -Physical -ErrorAction SilentlyContinue
        foreach ($p in $physicals) {
          $b = Get-NetAdapterBinding -Name $p.Name -ComponentID ms_tcpip -ErrorAction SilentlyContinue
          if ($b -and $b.Enabled -eq $false) { $bridgedPhysical = $p.Name; break }
        }
      }
      $result['bridgedPhysicalAdapter'] = $bridgedPhysical
    }
  }
}

$result | ConvertTo-Json -Compress -Depth 5
exit 0
`
  let raw: RawResult
  try {
    const stdout = await runPowerShell(script)
    raw = stdout ? (JSON.parse(stdout) as RawResult) : { found: false }
  } catch {
    return { eligible: false, reason: 'Could not determine the active network adapter.' }
  }

  if (!raw.found) {
    return { eligible: false, reason: 'No active internet connection was detected on this PC.' }
  }
  if (raw.ambiguous) {
    return {
      eligible: false,
      reason: 'Multiple network adapters are tied for the primary internet connection — could not determine a single adapter to change safely.'
    }
  }

  const adapter: DnsAdapterInfo = {
    interfaceIndex: raw.ifIndex!,
    interfaceAlias: raw.name!,
    interfaceDescription: raw.description!,
    isVirtual: !!raw.virtual
  }

  if (!adapter.isVirtual) {
    return { eligible: true, adapter }
  }

  if (raw.looksLikeHyperV && raw.bridgedPhysicalAdapter) {
    return { eligible: true, adapter }
  }

  const reason = raw.looksLikeHyperV
    ? `Primary network path is "${adapter.interfaceAlias}" (${adapter.interfaceDescription}), a Hyper-V virtual adapter, but no physical adapter on this PC has its TCP/IP binding disabled — could not confirm it's bridged to real hardware rather than an isolated/NAT switch. Skipped for safety.`
    : `Primary network path is "${adapter.interfaceAlias}" (${adapter.interfaceDescription}), a virtual network adapter — likely a VPN or similar tunnel. Skipped to avoid overriding DNS a VPN may be relying on for its own routing or leak protection.`

  return { eligible: false, reason, adapter }
}
