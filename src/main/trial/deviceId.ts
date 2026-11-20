import { createHash } from 'crypto'
import { runPowerShell } from '../system/powershell'

/**
 * A stable per-PC identifier for "one trial per machine". Windows' MachineGuid, hashed — the raw
 * GUID never leaves this PC, and the backend hashes it again before storing.
 */
export async function getDeviceId(): Promise<string> {
  const guid = await runPowerShell(
    `(Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Cryptography' -Name MachineGuid).MachineGuid`
  )
  if (!guid) throw new Error("Couldn't identify this PC.")
  return createHash('sha256').update(`flowtweaks-device:${guid.trim().toLowerCase()}`).digest('hex')
}
