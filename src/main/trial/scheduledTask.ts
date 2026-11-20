import { app } from 'electron'
import { runPowerShell, psQuote } from '../system/powershell'

const TASK_NAME = 'FlowTweaksTrialCheck'

/**
 * A Windows scheduled task that runs `Flow Tweaks.exe --enforce-trial` at the moment the trial
 * ends, then hourly, so the tweaks are reverted even if the customer never opens the app again.
 * It runs elevated (RunLevel Highest, created from the already-elevated app) so the HKLM reverts
 * work without a UAC prompt. StartWhenAvailable means a PC that was off at expiry catches up at
 * its next boot. The headless run exits immediately while the trial is still running, and removes
 * the task itself once there is nothing left to enforce.
 */
export async function registerTrialTask(endsAtMs: number): Promise<void> {
  if (!app.isPackaged) return
  const script = `
$ErrorActionPreference = 'Stop'
$action = New-ScheduledTaskAction -Execute '${psQuote(process.execPath)}' -Argument '--enforce-trial'
$at = [DateTimeOffset]::FromUnixTimeMilliseconds(${Math.floor(endsAtMs)}).LocalDateTime
$trigger = New-ScheduledTaskTrigger -Once -At $at -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 30)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 10) -MultipleInstances IgnoreNew
$user = [Security.Principal.WindowsIdentity]::GetCurrent().Name
try {
  $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Highest
  Register-ScheduledTask -TaskName '${TASK_NAME}' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
} catch {
  # Not elevated: a normal-rights task still reverts what it can (and retries hourly).
  $principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
  Register-ScheduledTask -TaskName '${TASK_NAME}' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
}
exit 0`
  try {
    await runPowerShell(script)
  } catch (err) {
    console.error('Could not register the trial expiry task:', err)
  }
}

export async function removeTrialTask(): Promise<void> {
  try {
    await runPowerShell(
      `Unregister-ScheduledTask -TaskName '${TASK_NAME}' -Confirm:$false -ErrorAction SilentlyContinue\nexit 0`
    )
  } catch (err) {
    console.error('Could not remove the trial expiry task:', err)
  }
}
