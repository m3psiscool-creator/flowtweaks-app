import type { Operation, TweakDefinition } from '../../../../data/schema'
import { runPowerShell } from '../../system/powershell'

const AMD_DISPLAY_CLASS_GUID = '{4d36e968-e325-11ce-bfc1-08002be10318}'
const AMD_DISPLAY_CLASS_KEY = `SYSTEM\\CurrentControlSet\\Control\\Class\\${AMD_DISPLAY_CLASS_GUID}`

/**
 * Finds the AMD adapter's driver registry subkey for this specific machine. Enumerating the class
 * key (Get-ChildItem on the parent) needs admin — confirmed directly (Access Denied non-elevated)
 * — even though reading a value under an already-known subkey path doesn't. Returns the relative
 * (HKLM-rooted) path, e.g. "SYSTEM\...\Class\{...}\0001", or null if no AMD adapter was found or
 * the read failed (not elevated, no AMD GPU, etc).
 *
 * When a machine has both an integrated and a discrete AMD GPU, each has its own independent copy
 * of every Chill/Boost/Anti-Lag/ULPS value — confirmed on real hardware during development. This
 * prefers whichever adapter's name ISN'T the generic "AMD Radeon(TM) Graphics" / "AMD Radeon
 * Graphics" string every Ryzen APU iGPU reports, on the assumption the discrete card is the one
 * actually rendering games. Known limitation: a system with two DISCRETE AMD GPUs (rare) isn't
 * disambiguated further — it just takes the first non-generic match.
 */
export async function resolveAmdAdapterSubkeyPath(): Promise<string | null> {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$candidates = @()
try {
  Get-ChildItem -Path 'HKLM:\\${AMD_DISPLAY_CLASS_KEY}' -ErrorAction Stop | ForEach-Object {
    $p = Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue
    if ($p -and ($p.DriverDesc -match 'AMD|Radeon' -or $p.ProviderName -match 'Advanced Micro Devices')) {
      $candidates += [PSCustomObject]@{ SubKey = $_.PSChildName; Desc = $p.DriverDesc }
    }
  }
} catch {}
if ($candidates.Count -eq 0) { exit 0 }
$discrete = $candidates | Where-Object { $_.Desc -notmatch '^AMD Radeon(\\(TM\\))? Graphics$' } | Select-Object -First 1
$chosen = if ($discrete) { $discrete } else { $candidates[0] }
Write-Output $chosen.SubKey
exit 0
`
  const subKey = (await runPowerShell(script).catch(() => '')).trim()
  if (!subKey) return null
  return `${AMD_DISPLAY_CLASS_KEY}\\${subKey}`
}

function resolveOperation(operation: Operation, amdPath: string | null): Operation {
  if (operation.type !== 'amdDriverRegistry' || !amdPath) return operation
  return {
    type: 'registry',
    hive: 'HKLM',
    path: amdPath,
    valueName: operation.valueName,
    valueType: operation.valueType,
    desiredValue: operation.desiredValue,
    disabledValue: operation.disabledValue
  }
}

function tweakNeedsAmdResolution(tweak: TweakDefinition): boolean {
  return (
    tweak.detect.some((op) => op.type === 'amdDriverRegistry') ||
    tweak.apply.some((op) => op.type === 'amdDriverRegistry')
  )
}

/** Resolves one tweak's amdDriverRegistry operations. Tweaks without any are returned unchanged. */
export async function withResolvedAmdTweak(tweak: TweakDefinition): Promise<TweakDefinition> {
  if (!tweakNeedsAmdResolution(tweak)) return tweak
  const amdPath = await resolveAmdAdapterSubkeyPath()
  return {
    ...tweak,
    detect: tweak.detect.map((op) => resolveOperation(op, amdPath)),
    apply: tweak.apply.map((op) => resolveOperation(op, amdPath))
  }
}

/**
 * Batch form for Scan, which reads every tweak in one pass — resolves the AMD path once and
 * reuses it, instead of one PowerShell round-trip per AMD tweak.
 */
export async function withResolvedAmdTweaks(tweaks: TweakDefinition[]): Promise<TweakDefinition[]> {
  if (!tweaks.some(tweakNeedsAmdResolution)) return tweaks
  const amdPath = await resolveAmdAdapterSubkeyPath()
  return tweaks.map((tweak) =>
    tweakNeedsAmdResolution(tweak)
      ? {
          ...tweak,
          detect: tweak.detect.map((op) => resolveOperation(op, amdPath)),
          apply: tweak.apply.map((op) => resolveOperation(op, amdPath))
        }
      : tweak
  )
}
