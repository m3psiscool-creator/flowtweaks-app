import { runPowerShell } from '../system/powershell'
import type { TempCacheSizeReport } from '../../shared/ipc-types'

interface RawSizes {
  TempFolderBytes?: number
  RecycleBinBytes?: number
}

/**
 * Measurement only — this deliberately does NOT delete anything, unlike the clear-temp-files tweak
 * (data/tweaks/storage-cleanup.ts) whose apply step isn't even wired up yet. Same two temp paths
 * that tweak targets, plus the Recycle Bin across every fixed drive since that's real reclaimable
 * space a customer would recognize. -Force -ErrorAction SilentlyContinue on every enumeration: some
 * subfolders (other users' temp/Recycle Bin contents) are permission-denied when unelevated — those
 * are silently skipped rather than undercounted-and-reported-as-exact, which is why this is a floor,
 * not a guaranteed-exact total.
 */
function buildScript(): string {
  return `
$ErrorActionPreference = 'SilentlyContinue'

function Get-FolderBytes($path) {
  if (-not (Test-Path $path)) { return 0 }
  $sum = (Get-ChildItem -Path $path -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { -not $_.PSIsContainer } |
    Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
  if ($null -eq $sum) { return 0 }
  return [int64]$sum
}

$tempBytes = (Get-FolderBytes "$env:TEMP") + (Get-FolderBytes "C:\\Windows\\Temp")

$recycleBytes = 0
Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue | ForEach-Object {
  $recycleBytes += Get-FolderBytes (Join-Path $_.Root '$RECYCLE.BIN')
}

@{ TempFolderBytes = [int64]$tempBytes; RecycleBinBytes = [int64]$recycleBytes } | ConvertTo-Json -Compress
exit 0
`
}

export async function getTempCacheSize(): Promise<TempCacheSizeReport> {
  try {
    const stdout = await runPowerShell(buildScript())
    if (!stdout) return { tempFolderBytes: 0, recycleBinBytes: 0, totalBytes: 0 }
    const raw = JSON.parse(stdout) as RawSizes
    const tempFolderBytes = raw.TempFolderBytes ?? 0
    const recycleBinBytes = raw.RecycleBinBytes ?? 0
    return { tempFolderBytes, recycleBinBytes, totalBytes: tempFolderBytes + recycleBinBytes }
  } catch {
    return { tempFolderBytes: 0, recycleBinBytes: 0, totalBytes: 0 }
  }
}
