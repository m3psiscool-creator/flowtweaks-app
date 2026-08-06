import type { Operation, TweakDefinition } from '../../../data/schema'
import { psQuote } from '../system/powershell'

export interface ScanOperationKey {
  tweakId: string
  opIndex: number
  operation: Operation
}

/**
 * fileCleanup/externalTool have no persistent "already applied" state to read back, so they're
 * excluded from the scan script entirely — their tweaks report currentState: 'unknown' by design.
 * networkDns is excluded too, but for a different reason: it has its own dedicated, adapter-aware
 * scan path (see src/main/tweaks/dns/) that doesn't fit this generic per-operation model at all.
 */
export function collectDetectableOperations(tweaks: TweakDefinition[]): ScanOperationKey[] {
  const keys: ScanOperationKey[] = []
  for (const tweak of tweaks) {
    tweak.detect.forEach((operation, opIndex) => {
      if (operation.type === 'fileCleanup' || operation.type === 'externalTool' || operation.type === 'networkDns') {
        return
      }
      keys.push({ tweakId: tweak.id, opIndex, operation })
    })
  }
  return keys
}

export function keyFor(tweakId: string, opIndex: number): string {
  return `${tweakId}__${opIndex}`
}

function buildOperationSnippet(key: string, operation: Operation): string {
  switch (operation.type) {
    case 'registry': {
      const path = psQuote(operation.path)
      const name = psQuote(operation.valueName)
      return `
try {
  $v = Get-ItemPropertyValue -Path '${operation.hive}:\\${path}' -Name '${name}' -ErrorAction Stop
  if ($v -is [byte[]]) {
    $result['${key}'] = ([BitConverter]::ToString($v) -replace '-', '')
  } else {
    $result['${key}'] = $v
  }
} catch {
  $result['${key}'] = $null
}`
    }
    case 'service': {
      const name = psQuote(operation.serviceName)
      return `
try {
  $svc = Get-CimInstance -ClassName Win32_Service -Filter "Name='${name}'" -ErrorAction Stop
  $result['${key}'] = $svc.StartMode
} catch {
  $result['${key}'] = $null
}`
    }
    case 'powerPlan': {
      return `
try {
  $plan = Get-CimInstance -Namespace root\\cimv2\\power -ClassName Win32_PowerPlan -Filter "IsActive='True'" -ErrorAction Stop
  $result['${key}'] = $plan.ElementName
} catch {
  $result['${key}'] = $null
}`
    }
    default:
      return ''
  }
}

/**
 * One PowerShell process reads everything Scan needs — spawning one per tweak would be far
 * slower. Every snippet handles its own expected failures via try/catch, so the trailing
 * `exit 0` matters: Windows PowerShell otherwise exits non-zero for ANY error recorded during
 * the session (caught or not), which would make one missing registry value fail the whole scan.
 */
export function buildScanScript(operations: ScanOperationKey[]): string {
  const snippets = operations.map(({ tweakId, opIndex, operation }) =>
    buildOperationSnippet(keyFor(tweakId, opIndex), operation)
  )
  return `
$ErrorActionPreference = 'SilentlyContinue'
$result = @{}
$result['__elevated'] = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
${snippets.join('\n')}
$result | ConvertTo-Json -Compress -Depth 5
exit 0
`
}
