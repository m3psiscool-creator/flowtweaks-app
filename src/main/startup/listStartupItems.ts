import { runPowerShell } from '../system/powershell'

export interface RawStartupItem {
  name: string
  command: string
  source: 'registry' | 'startupFolder'
  scope: 'user' | 'allUsers'
  /** Raw uppercase hex of the StartupApproved binary value, or null if no override was ever recorded. */
  approvedRaw: string | null
}

interface PsStartupEntry {
  Name?: string
  Command?: string
  Source?: string
  Scope?: string
  ApprovedRaw?: string | null
}

/**
 * One PowerShell pass: every Run-key entry (HKCU, HKLM, and HKLM's WOW6432Node mirror for 32-bit
 * apps on 64-bit Windows) plus every shortcut in both Startup folders, each paired with its real
 * StartupApproved state — the exact same registry flag Task Manager's Startup tab reads. WOW6432Node
 * entries are tracked under the same (non-WOW6432Node) StartupApproved\Run key as native HKLM
 * entries — Task Manager doesn't distinguish them, so neither does this.
 */
const SCAN_SCRIPT = `
$ErrorActionPreference = 'SilentlyContinue'
$items = New-Object System.Collections.ArrayList

function Get-ApprovedState($hive, $subKey, $name) {
  try {
    $v = Get-ItemPropertyValue -Path "$($hive):\\$subKey" -Name $name -ErrorAction Stop
    if ($v -is [byte[]]) { return ([BitConverter]::ToString($v) -replace '-', '') }
  } catch {}
  return $null
}

$runKeys = @(
  @{ Hive = 'HKCU'; Path = 'Software\\Microsoft\\Windows\\CurrentVersion\\Run'; Scope = 'user' },
  @{ Hive = 'HKLM'; Path = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'; Scope = 'allUsers' },
  @{ Hive = 'HKLM'; Path = 'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'; Scope = 'allUsers' }
)
foreach ($rk in $runKeys) {
  $keyPath = "$($rk.Hive):\\$($rk.Path)"
  if (Test-Path $keyPath) {
    $props = Get-ItemProperty -Path $keyPath -ErrorAction SilentlyContinue
    if ($props) {
      $approvedSubKey = 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
      $props.PSObject.Properties | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object {
        $approved = Get-ApprovedState $rk.Hive $approvedSubKey $_.Name
        [void]$items.Add([PSCustomObject]@{
          Name = $_.Name
          Command = "$($_.Value)"
          Source = 'registry'
          Scope = $rk.Scope
          ApprovedRaw = $approved
        })
      }
    }
  }
}

$folders = @(
  @{ Path = [Environment]::GetFolderPath('Startup'); Scope = 'user' },
  @{ Path = [Environment]::GetFolderPath('CommonStartup'); Scope = 'allUsers' }
)
foreach ($f in $folders) {
  if ($f.Path -and (Test-Path $f.Path)) {
    Get-ChildItem -Path $f.Path -File -ErrorAction SilentlyContinue | ForEach-Object {
      $hive = if ($f.Scope -eq 'user') { 'HKCU' } else { 'HKLM' }
      $approvedSubKey = 'Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder'
      $approved = Get-ApprovedState $hive $approvedSubKey $_.Name
      $target = $_.FullName
      if ($_.Extension -eq '.lnk') {
        try {
          $sh = New-Object -ComObject WScript.Shell
          $lnk = $sh.CreateShortcut($_.FullName)
          if ($lnk.TargetPath) { $target = $lnk.TargetPath }
        } catch {}
      }
      [void]$items.Add([PSCustomObject]@{
        Name = $_.Name
        Command = $target
        Source = 'startupFolder'
        Scope = $f.Scope
        ApprovedRaw = $approved
      })
    }
  }
}

$items | ConvertTo-Json -Compress -Depth 4
exit 0
`

export async function listStartupItems(): Promise<RawStartupItem[]> {
  const stdout = await runPowerShell(SCAN_SCRIPT).catch(() => '')
  if (!stdout) return []

  let parsed: PsStartupEntry | PsStartupEntry[]
  try {
    parsed = JSON.parse(stdout)
  } catch {
    return []
  }
  const list = Array.isArray(parsed) ? parsed : [parsed]

  return list
    .filter((r): r is Required<Pick<PsStartupEntry, 'Name'>> & PsStartupEntry => !!r && !!r.Name)
    .map((r) => ({
      name: r.Name as string,
      command: r.Command ?? '',
      source: r.Source === 'startupFolder' ? 'startupFolder' : 'registry',
      scope: r.Scope === 'allUsers' ? 'allUsers' : 'user',
      approvedRaw: r.ApprovedRaw ?? null
    }))
}
