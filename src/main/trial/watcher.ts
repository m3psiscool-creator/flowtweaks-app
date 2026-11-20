import { BrowserWindow } from 'electron'
import { loadTrialState } from './trialStore'
import { enforceTrialExpiry } from './enforce'

const CHECK_INTERVAL_MS = 10 * 60 * 1000

/**
 * While the app is open: confirm the trial at launch, every 10 minutes, and right as it ends — so
 * the tweaks come off at the moment of expiry, not on the next launch. The renderer is told so
 * the lock screen appears immediately.
 */
export function startTrialWatcher(): void {
  const tick = async (): Promise<void> => {
    let delay = CHECK_INTERVAL_MS
    try {
      const outcome = await enforceTrialExpiry()
      if (outcome === 'reverted' || outcome === 'paid') {
        for (const w of BrowserWindow.getAllWindows()) w.webContents.send('trial:changed')
      }
      const state = await loadTrialState()
      if (state?.kind === 'trial' && state.endsAt) {
        const untilEnd = Date.parse(state.endsAt) - Date.now() + 2000
        if (untilEnd > 0) delay = Math.min(delay, untilEnd)
      }
    } catch (err) {
      console.error('Trial watcher error:', err)
    }
    setTimeout(tick, delay)
  }
  void tick()
}
