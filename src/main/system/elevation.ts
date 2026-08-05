import { runPowerShell } from './powershell'

export async function isElevated(): Promise<boolean> {
  try {
    const stdout = await runPowerShell(
      `([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)`
    )
    return stdout.trim().toLowerCase() === 'true'
  } catch {
    return false
  }
}
