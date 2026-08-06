import type { Operation } from '../../../data/schema'
import type { SnapshotValue } from '../../shared/ipc-types'
import { runPowerShell, psQuote } from '../system/powershell'

export interface SnapshotRequest {
  key: string
  operation: Operation
}

function buildSnapshotSnippet(key: string, operation: Operation): string {
  switch (operation.type) {
    case 'registry': {
      const path = psQuote(operation.path)
      const name = psQuote(operation.valueName)
      const keyPath = `${operation.hive}:\\${path}`
      return `
$keyExisted = Test-Path '${keyPath}'
try {
  $v = Get-ItemPropertyValue -Path '${keyPath}' -Name '${name}' -ErrorAction Stop
  if ($v -is [byte[]]) { $raw = ([BitConverter]::ToString($v) -replace '-', '') } else { $raw = $v }
  $result['${key}'] = @{ kind = 'registry'; keyExisted = $keyExisted; present = $true; raw = $raw }
} catch {
  $result['${key}'] = @{ kind = 'registry'; keyExisted = $keyExisted; present = $false; raw = $null }
}`
    }
    case 'service': {
      const name = psQuote(operation.serviceName)
      return `
try {
  $svc = Get-CimInstance -ClassName Win32_Service -Filter "Name='${name}'" -ErrorAction Stop
  $result['${key}'] = @{ kind = 'service'; startMode = $svc.StartMode; wasRunning = ($svc.State -eq 'Running') }
} catch {
  $result['${key}'] = $null
}`
    }
    case 'powerPlan': {
      return `
try {
  $plan = Get-CimInstance -Namespace root\\cimv2\\power -ClassName Win32_PowerPlan -Filter "IsActive='True'" -ErrorAction Stop
  $guid = if ($plan.InstanceID -match '\\{([0-9a-fA-F-]+)\\}') { $matches[1] } else { '' }
  $result['${key}'] = @{ kind = 'powerPlan'; activeGuid = $guid; activeName = $plan.ElementName }
} catch {
  $result['${key}'] = $null
}`
    }
    // networkDns is handled entirely by src/main/tweaks/dns/ — adapter topology and connectivity
    // verification don't fit this generic capture-a-value model, so it never reaches here.
    default:
      return `$result['${key}'] = $null`
  }
}

export async function captureSnapshots(
  requests: SnapshotRequest[]
): Promise<Record<string, SnapshotValue | null>> {
  if (requests.length === 0) return {}

  const snippets = requests.map((r) => buildSnapshotSnippet(r.key, r.operation))
  // Every snippet handles its own expected failures via try/catch, so a stray entry in $Error
  // from one of them shouldn't fail the whole batch — Windows PowerShell otherwise exits
  // non-zero for ANY error recorded during the session, caught or not.
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$result = @{}
${snippets.join('\n')}
$result | ConvertTo-Json -Compress -Depth 6
exit 0
`
  const stdout = await runPowerShell(script)
  if (!stdout) return {}
  return JSON.parse(stdout) as Record<string, SnapshotValue | null>
}
