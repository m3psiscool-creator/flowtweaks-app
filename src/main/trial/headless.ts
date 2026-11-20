import { app } from 'electron'
import { loadTrialState } from './trialStore'
import { enforceTrialExpiry, revertOnUninstall } from './enforce'

export type HeadlessMode = 'enforce-trial' | 'uninstall-revert'

export function getHeadlessMode(argv: string[]): HeadlessMode | null {
  if (argv.includes('--enforce-trial')) return 'enforce-trial'
  if (argv.includes('--uninstall-revert')) return 'uninstall-revert'
  return null
}

/**
 * Windowless runs of the app: the hourly scheduled task, and the uninstaller. Always ends the
 * process itself, with a hard stop so a hung PowerShell can never leave the uninstaller waiting.
 */
export async function runHeadless(mode: HeadlessMode): Promise<void> {
  const hardStop = setTimeout(() => app.exit(0), 150_000)
  try {
    if (mode === 'uninstall-revert') {
      await revertOnUninstall()
    } else {
      // Cheap exit while the trial is still running — no network, nothing to do yet.
      const state = await loadTrialState()
      const endsMs = state?.endsAt ? Date.parse(state.endsAt) : 0
      if (state?.kind === 'trial' && endsMs > Date.now()) return
      await enforceTrialExpiry()
    }
  } catch (err) {
    console.error('Headless run failed:', err)
  } finally {
    clearTimeout(hardStop)
    app.exit(0)
  }
}
