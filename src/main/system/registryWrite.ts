import { psQuote } from './powershell'

/** PowerShell's registry provider wants a signed Int32 — 0xFFFFFFFF must be passed as -1. */
export function toSignedInt32(unsigned: number): number {
  return unsigned > 2147483647 ? unsigned - 4294967296 : unsigned
}

/** Shared by apply (write the tweak's desired value) and revert (write back a captured previous value) — same write, different source value. */
export function buildRegistryWriteScript(
  hive: 'HKCU' | 'HKLM',
  path: string,
  valueName: string,
  valueType: 'REG_DWORD' | 'REG_SZ' | 'REG_BINARY',
  value: string | number
): string {
  const keyPath = `${hive}:\\${psQuote(path)}`
  const name = psQuote(valueName)

  if (valueType === 'REG_DWORD') {
    const signed = toSignedInt32(Number(value))
    return `
if (-not (Test-Path '${keyPath}')) { New-Item -Path '${keyPath}' -Force | Out-Null }
New-ItemProperty -Path '${keyPath}' -Name '${name}' -Value ${signed} -PropertyType DWord -Force | Out-Null`
  }

  if (valueType === 'REG_BINARY') {
    const hex = String(value)
    return `
if (-not (Test-Path '${keyPath}')) { New-Item -Path '${keyPath}' -Force | Out-Null }
$hex = '${hex}'
$bytes = for ($i = 0; $i -lt $hex.Length; $i += 2) { [Convert]::ToByte($hex.Substring($i, 2), 16) }
New-ItemProperty -Path '${keyPath}' -Name '${name}' -Value ([byte[]]$bytes) -PropertyType Binary -Force | Out-Null`
  }

  // REG_SZ
  return `
if (-not (Test-Path '${keyPath}')) { New-Item -Path '${keyPath}' -Force | Out-Null }
New-ItemProperty -Path '${keyPath}' -Name '${name}' -Value '${psQuote(String(value))}' -PropertyType String -Force | Out-Null`
}
