import { runPowerShell, psQuote } from '../system/powershell'
import { isElevated } from '../system/elevation'
import type { CreateRestorePointResult, RestorePointInfo } from '../../shared/ipc-types'

/** System Restore can be turned off entirely on a drive — check first so we can say why, not just fail. */
export async function isSystemProtectionEnabled(): Promise<boolean> {
  try {
    const stdout = await runPowerShell(
      `if (Get-CimInstance -Namespace root\\default -ClassName SystemRestoreConfig -ErrorAction Stop) { 'yes' } else { 'no' }`
    )
    return stdout.trim() === 'yes'
  } catch {
    return false
  }
}

export async function createRestorePoint(description = 'Flow Tweaks'): Promise<CreateRestorePointResult> {
  // Checkpoint-Computer requires a full admin token — checking this first turns the WMI "Access is
  // denied" exception (which reads as a scary internal error) into the same graceful message the
  // rest of the app already shows for an unelevated launch.
  if (!(await isElevated())) {
    return {
      success: false,
      error:
        'Flow Tweaks needs administrator rights to create a restore point. Close the app and reopen it, then accept the "Allow this app to make changes" prompt.'
    }
  }

  const protectionEnabled = await isSystemProtectionEnabled()
  if (!protectionEnabled) {
    return {
      success: false,
      error:
        'System Restore is turned off on this PC. Turn it on in Windows (System Properties > System Protection) before applying tweaks.'
    }
  }

  try {
    await runPowerShell(
      `Checkpoint-Computer -Description '${psQuote(description)}' -RestorePointType 'MODIFY_SETTINGS'`
    )
    return { success: true }
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error)
    const firstLine = raw.split('\n')[0]?.trim() || raw
    return {
      success: false,
      error: `Windows wouldn't create a restore point (${firstLine}). Nothing was changed.`
    }
  }
}

interface RawRestorePoint {
  SequenceNumber: number
  Description: string
  CreationTimeIso: string
}

export async function listRestorePoints(): Promise<RestorePointInfo[]> {
  try {
    const stdout = await runPowerShell(
      `Get-ComputerRestorePoint | Select-Object SequenceNumber, Description, @{N='CreationTimeIso';E={[Management.ManagementDateTimeConverter]::ToDateTime($_.CreationTime).ToString('o')}} | ConvertTo-Json -Compress`
    )
    if (!stdout) return []
    const parsed = JSON.parse(stdout) as RawRestorePoint | RawRestorePoint[]
    const list = Array.isArray(parsed) ? parsed : [parsed]
    return list
      .map((p) => ({
        sequenceNumber: p.SequenceNumber,
        description: p.Description,
        creationTime: p.CreationTimeIso
      }))
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)
  } catch {
    return []
  }
}
