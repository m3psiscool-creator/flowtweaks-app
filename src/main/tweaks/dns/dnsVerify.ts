import { runPowerShell } from '../../system/powershell'

export interface DnsVerifyResult {
  success: boolean
  detail: string
}

/**
 * Confirms the new DNS servers actually work before declaring the tweak applied — not just that
 * the write succeeded. Two independent, high-availability domains (Microsoft's own connectivity
 * test endpoint, and Cloudflare's own domain), resolved through the SYSTEM resolver (exactly what
 * the customer's browser/game will use, not a query pinned to a specific server), followed by a
 * real TCP connect — DNS resolving but the network path being dead is a separate failure mode.
 *
 * Windows' own default timeouts for a non-responding DNS server (~12s) or dead TCP target (~20s)
 * are far too slow for a check that should finish in a few seconds — both use bounded, manually
 * enforced timeouts via .NET's async APIs instead of the built-in cmdlets' defaults.
 */
export async function verifyDnsConnectivity(): Promise<DnsVerifyResult> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
Clear-DnsClientCache

function Resolve-WithTimeout($name, $timeoutMs) {
  try {
    $task = [System.Net.Dns]::GetHostAddressesAsync($name)
    if ($task.Wait($timeoutMs)) {
      $addrs = $task.Result | Where-Object { $_.AddressFamily -eq 'InterNetwork' }
      if ($addrs) { return $addrs[0].ToString() }
    }
  } catch {}
  return $null
}

function Resolve-WithRetry($name, $timeoutMs) {
  $r = Resolve-WithTimeout $name $timeoutMs
  if ($r) { return $r }
  Start-Sleep -Milliseconds 500
  return Resolve-WithTimeout $name $timeoutMs
}

function Test-TcpWithTimeout($ipAddress, $port, $timeoutMs) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $task = $client.ConnectAsync($ipAddress, $port)
    $ok = $task.Wait($timeoutMs) -and $client.Connected
    $client.Close()
    return [bool]$ok
  } catch {
    return $false
  }
}

$ncsiIp = Resolve-WithRetry 'www.msftconnecttest.com' 2000
$cfIp = Resolve-WithRetry 'cloudflare.com' 2000

$tcpOk = $false
$tcpTarget = $null
if ($ncsiIp) {
  $tcpTarget = $ncsiIp
  $tcpOk = Test-TcpWithTimeout $ncsiIp 443 2000
}
if (-not $tcpOk -and $cfIp) {
  $tcpTarget = $cfIp
  $tcpOk = Test-TcpWithTimeout $cfIp 443 2000
}

@{
  ncsiResolved = [bool]$ncsiIp
  cloudflareResolved = [bool]$cfIp
  tcpOk = [bool]$tcpOk
  tcpTarget = $tcpTarget
} | ConvertTo-Json -Compress
exit 0
`
  interface RawVerify {
    ncsiResolved: boolean
    cloudflareResolved: boolean
    tcpOk: boolean
    tcpTarget: string | null
  }

  let raw: RawVerify
  try {
    const stdout = await runPowerShell(script)
    raw = stdout ? (JSON.parse(stdout) as RawVerify) : { ncsiResolved: false, cloudflareResolved: false, tcpOk: false, tcpTarget: null }
  } catch (error) {
    return {
      success: false,
      detail: `Verification script failed to run: ${error instanceof Error ? error.message : String(error)}`
    }
  }

  const resolvedCount = (raw.ncsiResolved ? 1 : 0) + (raw.cloudflareResolved ? 1 : 0)

  if (resolvedCount === 0) {
    return {
      success: false,
      detail: 'Neither www.msftconnecttest.com nor cloudflare.com resolved through the new DNS servers.'
    }
  }

  if (!raw.tcpOk) {
    return {
      success: false,
      detail: `DNS resolved (${raw.tcpTarget}) but a TCP connection to it on port 443 failed — the new DNS servers respond, but the network path doesn't work.`
    }
  }

  const domains = [raw.ncsiResolved ? 'www.msftconnecttest.com' : null, raw.cloudflareResolved ? 'cloudflare.com' : null]
    .filter(Boolean)
    .join(', ')
  return { success: true, detail: `Resolved and connected successfully via the new DNS servers (${domains}).` }
}
