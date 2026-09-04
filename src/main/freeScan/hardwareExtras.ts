import si from 'systeminformation'
import { runPowerShell } from '../system/powershell'
import type { FreeScanHardwareExtras, GpuDriverInfo, StorageType } from '../../shared/ipc-types'

/**
 * si.diskLayout() already reports MediaType-derived 'SSD'/'HD' per physical disk without needing a
 * PowerShell round-trip (confirmed against Get-PhysicalDisk during development — same answer,
 * cheaper). USB-attached drives are excluded so an external HDD doesn't drag a customer's NVMe-only
 * system down to 'mixed'.
 */
async function detectStorageType(): Promise<StorageType> {
  const disks = await si.diskLayout().catch(() => [])
  const fixed = disks.filter((d) => d.interfaceType !== 'USB')
  if (fixed.length === 0) return 'unknown'

  const hasSsd = fixed.some((d) => d.type === 'SSD')
  const hasHdd = fixed.some((d) => d.type === 'HD')
  if (hasSsd && hasHdd) return 'mixed'
  if (hasSsd) return 'ssd'
  if (hasHdd) return 'hdd'
  return 'unknown'
}

async function detectRefreshRate(): Promise<number | null> {
  const graphics = await si.graphics().catch(() => null)
  const mainDisplay = graphics?.displays.find((d) => d.main) ?? graphics?.displays[0]
  const rate = mainDisplay?.currentRefreshRate
  return typeof rate === 'number' && rate > 0 ? rate : null
}

async function detectMotherboard(): Promise<string> {
  const board = await si.baseboard().catch(() => null)
  if (!board || (!board.manufacturer && !board.model)) return 'Unknown'
  return [board.manufacturer, board.model].filter(Boolean).join(' ').trim() || 'Unknown'
}

interface RawDriverEntry {
  Name?: string
  DriverVersion?: string
  DriverDate?: string
}

/**
 * systeminformation's graphics().controllers doesn't expose driver version on this Electron/Windows
 * combo (confirmed empty during development) — Win32_VideoController over CIM is the reliable
 * source. Adapters with no DriverVersion at all (Microsoft Basic Display, RDP virtual adapters) are
 * filtered out so a real GPU's driver isn't shadowed by a virtual one enumerated alongside it.
 */
async function detectGpuDriver(): Promise<GpuDriverInfo> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$controllers = Get-CimInstance Win32_VideoController | Where-Object { $_.DriverVersion }
$results = foreach ($c in $controllers) {
  $dateStr = $null
  if ($c.DriverDate) {
    try {
      # Get-CimInstance (unlike the legacy Get-WmiObject) already returns DriverDate as a real
      # [DateTime], not the raw WMI DMTF string — ManagementDateTimeConverter throws if handed one,
      # so branch on the actual runtime type instead of assuming either shape.
      if ($c.DriverDate -is [DateTime]) {
        $dateStr = $c.DriverDate.ToString('yyyy-MM-dd')
      } else {
        $dateStr = ([Management.ManagementDateTimeConverter]::ToDateTime($c.DriverDate)).ToString('yyyy-MM-dd')
      }
    } catch {}
  }
  [PSCustomObject]@{ Name = $c.Name; DriverVersion = $c.DriverVersion; DriverDate = $dateStr }
}
@($results) | ConvertTo-Json -Compress -Depth 3
exit 0
`
  try {
    const stdout = await runPowerShell(script)
    if (!stdout) return { version: null, date: null }
    const parsed = JSON.parse(stdout) as RawDriverEntry | RawDriverEntry[]
    const list = Array.isArray(parsed) ? parsed : [parsed]
    const real = list.find((c) => c.Name && !/Microsoft Basic|Remote Desktop/i.test(c.Name))
    if (!real) return { version: null, date: null }
    return { version: real.DriverVersion ?? null, date: real.DriverDate ?? null }
  } catch {
    return { version: null, date: null }
  }
}

export async function getFreeScanHardwareExtras(): Promise<FreeScanHardwareExtras> {
  const [motherboard, storageType, refreshRateHz, gpuDriver] = await Promise.all([
    detectMotherboard(),
    detectStorageType(),
    detectRefreshRate(),
    detectGpuDriver()
  ])
  return { motherboard, storageType, refreshRateHz, gpuDriver }
}
